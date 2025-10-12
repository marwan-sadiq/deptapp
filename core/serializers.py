from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import User
from .models import UserProfile, Customer, Company, Debt, AuditLog, PaymentPlan, PaymentSchedule, DailyBalance, ShopMoney, EntityActivity




class UserLoginSerializer(serializers.Serializer):
    """Secure serializer for user login with input validation"""
    username = serializers.CharField(
        max_length=150,
        min_length=3,
        trim_whitespace=True,
        help_text="Username must be 3-150 characters long"
    )
    password = serializers.CharField(
        min_length=1,
        write_only=True,
        help_text="Password is required"
    )

    def validate_username(self, value):
        """Validate and sanitize username"""
        if not value:
            raise serializers.ValidationError('Username is required')

        # Remove any potentially dangerous characters
        import re
        if not re.match(r'^[a-zA-Z0-9_@.+-]+$', value):
            raise serializers.ValidationError('Username contains invalid characters')

        # Check for SQL injection patterns
        dangerous_patterns = ['--', '/*', '*/', 'xp_', 'sp_', 'exec', 'execute', 'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter']
        if any(pattern in value.lower() for pattern in dangerous_patterns):
            raise serializers.ValidationError('Invalid username format')

        return value.strip()

    def validate_password(self, value):
        """Validate password"""
        if not value:
            raise serializers.ValidationError('Password is required')

        if len(value) < 1:
            raise serializers.ValidationError('Password cannot be empty')

        return value

    def validate(self, attrs):
        """Validate login credentials"""
        username = attrs.get('username')
        password = attrs.get('password')

        if not username or not password:
            raise serializers.ValidationError('Both username and password are required')

        # Attempt authentication
        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError('Invalid credentials')

        if not user.is_active:
            raise serializers.ValidationError('User account is disabled')

        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    phone = serializers.CharField(source='profile.phone', read_only=True)
    is_manager = serializers.BooleanField(source='profile.is_manager', read_only=True)
    created_at = serializers.DateTimeField(source='profile.created_at', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'is_manager', 'is_active', 'created_at']
        read_only_fields = ['id', 'is_active', 'created_at']


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    phone = serializers.CharField(source='profile.phone', required=False)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})

        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update profile fields
        if hasattr(instance, 'profile'):
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        else:
            UserProfile.objects.create(user=instance, **profile_data)

        return instance


class CustomerSerializer(serializers.ModelSerializer):
    total_debt = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    earliest_due_date = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ["id", "user", "name", "phone", "address", "created_at", "updated_at", "market_money", "total_debt",
                 "reputation", "reputation_score", "last_payment_date", "total_paid_30_days", "payment_streak_days", "earliest_due_date"]
        read_only_fields = ["user"]

    def get_earliest_due_date(self, obj):
        return obj.get_earliest_due_date()


class CompanySerializer(serializers.ModelSerializer):
    total_debt = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    earliest_due_date = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = ["id", "user", "name", "phone", "address", "created_at", "updated_at", "market_money", "total_debt", "earliest_due_date"]
        read_only_fields = ["user"]

    def get_earliest_due_date(self, obj):
        return obj.get_earliest_due_date()


class DebtSerializer(serializers.ModelSerializer):
    override = serializers.BooleanField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Debt
        fields = ["id", "customer", "company", "amount", "note", "is_settled", "due_date", "override", "created_at", "updated_at"]

    def validate(self, data):
        customer = data.get('customer')
        company = data.get('company')
        amount = data.get('amount', 0)

        # Convert to Decimal if it's a string or float
        if isinstance(amount, (str, float)):
            amount = Decimal(str(amount))

        # Validate that either customer or company is provided (but not both)
        if not customer and not company:
            raise serializers.ValidationError('Either customer or company must be provided')
        if customer and company:
            raise serializers.ValidationError('Provide only one of customer or company')

        # Only check credit control for new POSITIVE debt to customers (unless overridden)
        # Payments (negative amounts) should always be allowed
        if customer and amount > 0 and not self.instance and not data.get('override'):
            can_receive, reason = customer.can_receive_new_debt()
            if not can_receive:
                raise serializers.ValidationError(f"Cannot increase debt: {reason}")

        return data

    def create(self, validated_data):
        # Remove override field before creating the debt
        validated_data.pop('override', None)
        return super().create(validated_data)


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ["id", "action", "entity_type", "entity_id", "description", "amount", "created_at"]


class PaymentPlanSerializer(serializers.ModelSerializer):
    entity_name = serializers.SerializerMethodField()

    class Meta:
        model = PaymentPlan
        fields = ["id", "customer", "company", "total_debt", "paid_amount", "remaining_debt",
                 "manual_priority", "is_active", "entity_name", "created_at", "updated_at"]

    def get_entity_name(self, obj):
        return obj.customer.name if obj.customer else obj.company.name


class PaymentScheduleSerializer(serializers.ModelSerializer):
    entity_name = serializers.SerializerMethodField()

    class Meta:
        model = PaymentSchedule
        fields = ["id", "payment_plan", "scheduled_date", "scheduled_amount", "actual_amount",
                 "is_paid", "paid_at", "entity_name", "created_at", "updated_at"]

    def get_entity_name(self, obj):
        plan = obj.payment_plan
        return plan.customer.name if plan.customer else plan.company.name


class DailyBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyBalance
        fields = ["id", "date", "available_amount", "created_at", "updated_at"]


class PaymentPlanGenerationSerializer(serializers.Serializer):
    daily_balances = serializers.DictField(
        child=serializers.DecimalField(max_digits=12, decimal_places=2),
        help_text="Dictionary with dates as keys and available amounts as values"
    )
    debts = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of debt objects with company, totalDebt, paid, and manualPriority"
    )


class ShopMoneySerializer(serializers.ModelSerializer):
    """Serializer for shop money"""
    class Meta:
        model = ShopMoney
        fields = ['id', 'user', 'current_money', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']


class EntityActivitySerializer(serializers.ModelSerializer):
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)

    class Meta:
        model = EntityActivity
        fields = ['id', 'activity_type', 'activity_type_display', 'description', 'amount',
                 'related_object_type', 'related_object_id', 'created_at', 'updated_at']

