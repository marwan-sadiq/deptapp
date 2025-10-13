from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.throttling import AnonRateThrottle
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.core.cache import cache
from django.utils import timezone
from django.db import models
from decimal import Decimal
from datetime import datetime, timedelta
import logging
from .models import UserProfile, Customer, Company, Debt, AuditLog, PaymentPlan, PaymentSchedule, DailyBalance, ShopMoney, EntityActivity, Currency
from .serializers import (UserLoginSerializer, UserProfileSerializer, UserUpdateSerializer,
                         CustomerSerializer, CompanySerializer, DebtSerializer, AuditLogSerializer,
                         PaymentPlanSerializer, PaymentScheduleSerializer, DailyBalanceSerializer,
                         PaymentPlanGenerationSerializer, ShopMoneySerializer, EntityActivitySerializer, CurrencySerializer)
from .payment_algorithm import PaymentPlanner




class UserLoginView(APIView):
    """Secure user login endpoint with rate limiting and account lockout"""
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]
    
    def post(self, request):
        # Get client IP for rate limiting
        client_ip = self.get_client_ip(request)
        username = request.data.get('username', '')
        
        # Check for account lockout
        lockout_key = f"login_lockout_{username}_{client_ip}"
        if cache.get(lockout_key):
            return Response({
                'error': 'Account temporarily locked due to too many failed attempts. Please try again later.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Check for brute force attempts
        attempt_key = f"login_attempts_{client_ip}"
        attempts = cache.get(attempt_key, 0)
        
        if attempts >= 5:  # Lock after 5 failed attempts
            cache.set(lockout_key, True, 900)  # Lock for 15 minutes
            return Response({
                'error': 'Too many failed login attempts. Account locked for 15 minutes.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Reset failed attempts on successful login
            cache.delete(attempt_key)
            
            # Log successful login
            logging.info(f"Successful login for user: {user.username} from IP: {client_ip}")
            
            login(request, user)
            
            # Create or get token (no expiration for permanent login)
            token, created = Token.objects.get_or_create(user=user)
            
            # No token expiration - users stay logged in permanently
            # token_expiry = timezone.now() + timedelta(hours=24)
            # cache.set(f"token_expiry_{token.key}", token_expiry, 86400)  # 24 hours
            
            return Response({
                'user': UserProfileSerializer(user).data,
                'token': token.key,
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)
        else:
            # Increment failed attempts
            cache.set(attempt_key, attempts + 1, 900)  # Reset after 15 minutes
            
            # Log failed attempt
            logging.warning(f"Failed login attempt for username: {username} from IP: {client_ip}")
            
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserLogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            request.user.auth_token.delete()
        except:
            pass
        logout(request)
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    """User profile management"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user profile"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        """Update user profile"""
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'user': UserProfileSerializer(request.user).data,
                'message': 'Profile updated successfully'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def check_auth_status(request):
    """Check if user is authenticated"""
    if request.user.is_authenticated:
        return Response({
            'authenticated': True,
            'user': UserProfileSerializer(request.user).data
        })
    else:
        return Response({
            'authenticated': False,
            'user': None
        })


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

    def get_queryset(self):
        # Filter customers by the authenticated user
        return Customer.objects.filter(user=self.request.user)

    @action(detail=True, methods=["get"])
    def debts(self, request, pk=None):
        # Verify the customer belongs to the current user
        try:
            customer = Customer.objects.get(id=pk, user=request.user)
            debts = Debt.objects.filter(customer_id=pk).order_by('-created_at')
            return Response(DebtSerializer(debts, many=True).data)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found or access denied'}, status=status.HTTP_404_NOT_FOUND)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        # Update reputation for new customer
        instance.update_reputation()
        AuditLog.objects.create(
            action="create",
            entity_type="customer",
            entity_id=instance.id,
            description=f"Customer {instance.name}",
        )
        # Create entity activity
        EntityActivity.objects.create(
            customer=instance,
            activity_type='profile_created',
            description=f"Customer profile created: {instance.name}",
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        # Update reputation when customer is updated
        instance.update_reputation()
        AuditLog.objects.create(
            action="update",
            entity_type="customer",
            entity_id=instance.id,
            description=f"Customer {instance.name} updated",
        )
        # Create entity activity
        EntityActivity.objects.create(
            customer=instance,
            activity_type='profile_updated',
            description=f"Customer profile updated: {instance.name}",
        )

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            action="delete",
            entity_type="customer",
            entity_id=instance.id,
            description=f"Customer {instance.name}",
        )
        # Create entity activity
        EntityActivity.objects.create(
            customer=instance,
            activity_type='profile_deleted',
            description=f"Customer profile deleted: {instance.name}",
        )
        return super().perform_destroy(instance)


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

    def get_queryset(self):
        # Filter companies by the authenticated user
        return Company.objects.filter(user=self.request.user)

    @action(detail=True, methods=["get"])
    def debts(self, request, pk=None):
        # Verify the company belongs to the current user
        try:
            company = Company.objects.get(id=pk, user=request.user)
            debts = Debt.objects.filter(company_id=pk).order_by('-created_at')
            return Response(DebtSerializer(debts, many=True).data)
        except Company.DoesNotExist:
            return Response({'error': 'Company not found or access denied'}, status=status.HTTP_404_NOT_FOUND)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        AuditLog.objects.create(
            action="create",
            entity_type="company",
            entity_id=instance.id,
            description=f"Company {instance.name}",
        )
        # Create entity activity
        EntityActivity.objects.create(
            company=instance,
            activity_type='profile_created',
            description=f"Company profile created: {instance.name}",
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(
            action="update",
            entity_type="company",
            entity_id=instance.id,
            description=f"Company {instance.name} updated",
        )
        # Create entity activity
        EntityActivity.objects.create(
            company=instance,
            activity_type='profile_updated',
            description=f"Company profile updated: {instance.name}",
        )

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            action="delete",
            entity_type="company",
            entity_id=instance.id,
            description=f"Company {instance.name}",
        )
        # Create entity activity
        EntityActivity.objects.create(
            company=instance,
            activity_type='profile_deleted',
            description=f"Company profile deleted: {instance.name}",
        )
        return super().perform_destroy(instance)


class DebtViewSet(viewsets.ModelViewSet):
    queryset = Debt.objects.all().order_by('-created_at')
    serializer_class = DebtSerializer
    
    def get_queryset(self):
        # Filter debts by user - only show debts for customers/companies owned by the current user
        user = self.request.user
        queryset = Debt.objects.filter(
            models.Q(customer__user=user) | models.Q(company__user=user)
        ).order_by('-created_at')
        
        customer_id = self.request.query_params.get('customer')
        company_id = self.request.query_params.get('company')
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if company_id:
            queryset = queryset.filter(company_id=company_id)
            
        return queryset

    def perform_create(self, serializer):
        customer = serializer.validated_data.get('customer')
        company = serializer.validated_data.get('company')
        if not customer and not company:
            raise ValueError("Either customer or company must be provided")
        if customer and company:
            raise ValueError("Provide only one of customer or company")
        instance = serializer.save()
        
        # Ensure total_debt is updated after debt creation
        if customer:
            customer.update_total_debt()
        elif company:
            company.update_total_debt()
        
        # Create audit log for the debt
        AuditLog.objects.create(
            action="create",
            entity_type="debt",
            entity_id=instance.id,
            description=instance.note or "",
            amount=instance.amount,
        )
        
        # Create entity activity for the associated customer or company
        if customer:
            EntityActivity.objects.create(
                customer=customer,
                activity_type='debt_created',
                description=f"Debt added: {instance.note or 'No description'}",
                amount=instance.amount,
                related_object_type='debt',
                related_object_id=instance.id,
            )
        elif company:
            EntityActivity.objects.create(
                company=company,
                activity_type='debt_created',
                description=f"Debt added: {instance.note or 'No description'}",
                amount=instance.amount,
                related_object_type='debt',
                related_object_id=instance.id,
            )

    def perform_destroy(self, instance):
        # Store references before deletion
        customer = instance.customer
        company = instance.company
        
        # Create audit log for the debt
        AuditLog.objects.create(
            action="delete",
            entity_type="debt",
            entity_id=instance.id,
            description=instance.note or "",
            amount=instance.amount,
        )
        
        # Create entity activity for the associated customer or company
        if customer:
            EntityActivity.objects.create(
                customer=customer,
                activity_type='debt_deleted',
                description=f"Debt deleted: {instance.note or 'No description'}",
                amount=instance.amount,
                related_object_type='debt',
                related_object_id=instance.id,
            )
        elif company:
            EntityActivity.objects.create(
                company=company,
                activity_type='debt_deleted',
                description=f"Debt deleted: {instance.note or 'No description'}",
                amount=instance.amount,
                related_object_type='debt',
                related_object_id=instance.id,
            )
        
        # Delete the debt first
        super().perform_destroy(instance)
        
        # Update total_debt after deletion
        if customer:
            customer.update_total_debt()
        elif company:
            company.update_total_debt()

    def perform_update(self, serializer):
        instance = serializer.save()
        
        # The Debt.save() method will automatically update total_debt
        # But we need to ensure it's called by saving the instance again
        instance.save()
        
        # Create audit log for the debt update
        AuditLog.objects.create(
            action="create",  # Using "create" for updates to maintain consistency
            entity_type="debt",
            entity_id=instance.id,
            description=f"Debt updated: {instance.note or 'No description'}",
            amount=instance.amount,
        )
        
        # Create entity activity for the associated customer or company
        if instance.customer:
            EntityActivity.objects.create(
                customer=instance.customer,
                activity_type='debt_updated',
                description=f"Debt updated: {instance.note or 'No description'}",
                amount=instance.amount,
                related_object_type='debt',
                related_object_id=instance.id,
            )
        elif instance.company:
            EntityActivity.objects.create(
                company=instance.company,
                activity_type='debt_updated',
                description=f"Debt updated: {instance.note or 'No description'}",
                amount=instance.amount,
                related_object_type='debt',
                related_object_id=instance.id,
            )


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filter audit logs by user - only show logs for entities owned by the current user
        user = self.request.user
        queryset = AuditLog.objects.filter(
            models.Q(entity_type='customer', entity_id__in=Customer.objects.filter(user=user).values_list('id', flat=True)) |
            models.Q(entity_type='company', entity_id__in=Company.objects.filter(user=user).values_list('id', flat=True)) |
            models.Q(entity_type='debt', entity_id__in=Debt.objects.filter(
                models.Q(customer__user=user) | models.Q(company__user=user)
            ).values_list('id', flat=True))
        )
        
        entity_type = self.request.query_params.get('entity_type')
        entity_id = self.request.query_params.get('entity_id')
        
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        if entity_id:
            queryset = queryset.filter(entity_id=entity_id)
            
        return queryset.order_by('-created_at')


class PaymentPlanViewSet(viewsets.ModelViewSet):
    queryset = PaymentPlan.objects.all()
    serializer_class = PaymentPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter payment plans by user - only show plans for customers/companies owned by the current user
        user = self.request.user
        return PaymentPlan.objects.filter(
            models.Q(customer__user=user) | models.Q(company__user=user),
            is_active=True
        ).order_by('manual_priority', 'remaining_debt')


class PaymentScheduleViewSet(viewsets.ModelViewSet):
    queryset = PaymentSchedule.objects.all()
    serializer_class = PaymentScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter payment schedules by user - only show schedules for customers/companies owned by the current user
        user = self.request.user
        return PaymentSchedule.objects.filter(
            models.Q(payment_plan__customer__user=user) | models.Q(payment_plan__company__user=user)
        ).order_by('scheduled_date')


class DailyBalanceViewSet(viewsets.ModelViewSet):
    queryset = DailyBalance.objects.all()
    serializer_class = DailyBalanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # DailyBalance is global, not user-specific - show all balances
        return DailyBalance.objects.all().order_by('-date')


class ShopMoneyViewSet(viewsets.ModelViewSet):
    queryset = ShopMoney.objects.all()
    serializer_class = ShopMoneySerializer

    def get_queryset(self):
        # Filter shop money by the authenticated user
        return ShopMoney.objects.filter(user=self.request.user).order_by('-updated_at')

    def list(self, request, *args, **kwargs):
        # Return the user's shop money entry or return 0 if none exists
        shop_money = ShopMoney.objects.filter(user=request.user).first()
        if not shop_money:
            # Return a default response with 0 instead of creating a record
            return Response({
                'id': None,
                'user': request.user.id,
                'current_money': '0.00',
                'created_at': None,
                'updated_at': None
            })
        serializer = self.get_serializer(shop_money)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        # Update the existing shop money or create new one for the user
        shop_money = ShopMoney.objects.filter(user=request.user).first()
        if shop_money:
            serializer = self.get_serializer(shop_money, data=request.data)
        else:
            serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_payment_plan(request):
    """
    Generate a payment plan based on daily balances and debts.
    
    Expected input:
    {
        "dailyBalances": {
            "2025-01-15": 1000,
            "2025-01-16": 1500,
            "2025-01-17": 800
        },
        "debts": [
            {
                "company": "Company A",
                "totalDebt": 2000,
                "paid": 500,
                "manualPriority": 1
            },
            {
                "customer": "Customer B", 
                "totalDebt": 1000,
                "paid": 0,
                "manualPriority": 2
            }
        ]
    }
    """
    serializer = PaymentPlanGenerationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    daily_balances = {k: Decimal(str(v)) for k, v in data['dailyBalances'].items()}
    debts = data['debts']
    
    # Generate payment plan using algorithm
    planner = PaymentPlanner()
    result = planner.generate_payment_plan(daily_balances, debts)
    
    # Save payment plans to database
    saved_plans = []
    for plan in result['payment_plans']:
        plan.save()
        saved_plans.append(plan)
    
    # Save payment schedules to database
    saved_schedules = []
    for schedule in result['schedules']:
        schedule.save()
        saved_schedules.append(schedule)
    
    # Save daily balances
    for date_str, amount in daily_balances.items():
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        balance, created = DailyBalance.objects.get_or_create(
            date=date_obj,
            defaults={'available_amount': amount}
        )
        if not created:
            balance.available_amount = amount
            balance.save()
    
    # Return response with serialized data
    response_data = {
        'payment_plans': PaymentPlanSerializer(saved_plans, many=True).data,
        'schedules': PaymentScheduleSerializer(saved_schedules, many=True).data,
        'summary': {
            'total_scheduled': float(result['total_scheduled']),
            'total_available': float(result['total_available']),
            'utilization_rate': float(result['utilization_rate']),
            'days_planned': len(daily_balances),
            'debts_planned': len(saved_plans)
        }
    }
    
    return Response(response_data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payment_schedule(request):
    """
    Get the full payment schedule for a date range.
    
    Query parameters:
    - start_date: Start date (YYYY-MM-DD)
    - end_date: End date (YYYY-MM-DD)
    - entity_id: Filter by specific customer/company ID
    - entity_type: 'customer' or 'company'
    """
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    entity_id = request.query_params.get('entity_id')
    entity_type = request.query_params.get('entity_type')
    
    queryset = PaymentSchedule.objects.all()
    
    if start_date:
        queryset = queryset.filter(scheduled_date__gte=start_date)
    if end_date:
        queryset = queryset.filter(scheduled_date__lte=end_date)
    if entity_id and entity_type:
        if entity_type == 'customer':
            queryset = queryset.filter(payment_plan__customer_id=entity_id)
        elif entity_type == 'company':
            queryset = queryset.filter(payment_plan__company_id=entity_id)
    
    schedules = queryset.order_by('scheduled_date')
    serializer = PaymentScheduleSerializer(schedules, many=True)
    
    # Calculate summary statistics
    total_scheduled = sum(s.scheduled_amount for s in schedules)
    total_paid = sum(s.actual_amount for s in schedules if s.is_paid)
    pending_amount = total_scheduled - total_paid
    
    response_data = {
        'schedules': serializer.data,
        'summary': {
            'total_scheduled': float(total_scheduled),
            'total_paid': float(total_paid),
            'pending_amount': float(pending_amount),
            'completion_rate': float(total_paid / total_scheduled) if total_scheduled > 0 else 0,
            'total_days': len(set(s.scheduled_date for s in schedules))
        }
    }
    
    return Response(response_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_payment_completed(request, schedule_id):
    """
    Mark a scheduled payment as completed with actual amount.
    """
    try:
        schedule = PaymentSchedule.objects.get(id=schedule_id)
    except PaymentSchedule.DoesNotExist:
        return Response({'error': 'Payment schedule not found'}, status=status.HTTP_404_NOT_FOUND)
    
    actual_amount = request.data.get('actual_amount')
    if actual_amount is None:
        actual_amount = schedule.scheduled_amount
    else:
        actual_amount = Decimal(str(actual_amount))
    
    schedule.actual_amount = actual_amount
    schedule.is_paid = True
    schedule.paid_at = datetime.now()
    schedule.save()
    
    # Update payment plan
    plan = schedule.payment_plan
    plan.paid_amount += actual_amount
    plan.remaining_debt -= actual_amount
    plan.save()
    
    # Create audit log
    AuditLog.objects.create(
        action="create",
        entity_type="payment",
        entity_id=schedule.id,
        description=f"Payment completed for {plan.customer.name if plan.customer else plan.company.name}",
        amount=actual_amount
    )
    
    return Response(PaymentScheduleSerializer(schedule).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_analytics(request):
    """
    Get analytics and insights about payment plans.
    """
    # Get date range from query params
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    queryset = PaymentSchedule.objects.all()
    if start_date:
        queryset = queryset.filter(scheduled_date__gte=start_date)
    if end_date:
        queryset = queryset.filter(scheduled_date__lte=end_date)
    
    # Calculate analytics
    total_scheduled = sum(s.scheduled_amount for s in queryset)
    total_paid = sum(s.actual_amount for s in queryset if s.is_paid)
    pending_amount = total_scheduled - total_paid
    
    # Payment completion rate by priority
    priority_stats = {}
    for priority in [1, 2, 3]:
        priority_schedules = queryset.filter(payment_plan__manual_priority=priority)
        priority_scheduled = sum(s.scheduled_amount for s in priority_schedules)
        priority_paid = sum(s.actual_amount for s in priority_schedules if s.is_paid)
        priority_stats[f'priority_{priority}'] = {
            'scheduled': float(priority_scheduled),
            'paid': float(priority_paid),
            'completion_rate': float(priority_paid / priority_scheduled) if priority_scheduled > 0 else 0
        }
    
    # Daily utilization
    daily_balances = DailyBalance.objects.all()
    if start_date:
        daily_balances = daily_balances.filter(date__gte=start_date)
    if end_date:
        daily_balances = daily_balances.filter(date__lte=end_date)
    
    daily_utilization = []
    for balance in daily_balances:
        day_schedules = queryset.filter(scheduled_date=balance.date)
        day_scheduled = sum(s.scheduled_amount for s in day_schedules)
        utilization_rate = float(day_scheduled / balance.available_amount) if balance.available_amount > 0 else 0
        
        daily_utilization.append({
            'date': balance.date.isoformat(),
            'available': float(balance.available_amount),
            'scheduled': float(day_scheduled),
            'utilization_rate': utilization_rate
        })
    
    response_data = {
        'overview': {
            'total_scheduled': float(total_scheduled),
            'total_paid': float(total_paid),
            'pending_amount': float(pending_amount),
            'completion_rate': float(total_paid / total_scheduled) if total_scheduled > 0 else 0
        },
        'priority_breakdown': priority_stats,
        'daily_utilization': daily_utilization
    }
    
    return Response(response_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_all_reputations(request):
    """
    Update reputation scores for all customers based on their payment behavior.
    """
    customers = Customer.objects.filter(user=request.user)
    updated_count = 0
    
    for customer in customers:
        customer.update_reputation()
        updated_count += 1
    
    return Response({
        'message': f'Updated reputation for {updated_count} customers',
        'updated_count': updated_count
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_customer_reputation(request, customer_id):
    """
    Update reputation for a specific customer.
    """
    try:
        customer = Customer.objects.get(id=customer_id, user=request.user)
        customer.update_reputation()
        
        return Response({
            'message': f'Updated reputation for {customer.name}',
            'customer_id': customer.id,
            'reputation': customer.reputation,
            'reputation_score': customer.reputation_score,
            'total_paid_30_days': customer.total_paid_30_days
        })
    except Customer.DoesNotExist:
        return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_customer_credit(request, customer_id):
    """
    Check if a customer can receive new debt.
    """
    try:
        customer = Customer.objects.get(id=customer_id, user=request.user)
        can_receive, reason = customer.can_receive_new_debt()
        
        return Response({
            'customer_id': customer.id,
            'customer_name': customer.name,
            'can_receive_new_debt': can_receive,
            'reason': reason,
            'reputation': customer.reputation,
            'reputation_score': customer.reputation_score,
            'total_paid_30_days': customer.total_paid_30_days,
            'current_debt': sum(d.amount for d in customer.debts.filter(is_settled=False))
        })
    except Customer.DoesNotExist:
        return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)


class CurrencyViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for currencies - read-only for frontend"""
    queryset = Currency.objects.filter(is_active=True)
    serializer_class = CurrencySerializer
    permission_classes = []  # Make currencies public - no authentication required
    
    def get_queryset(self):
        return Currency.objects.filter(is_active=True).order_by('code')


class EntityActivityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EntityActivity.objects.all()
    serializer_class = EntityActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter entity activities by user - only show activities for customers/companies owned by the current user
        user = self.request.user
        queryset = EntityActivity.objects.filter(
            models.Q(customer__user=user) | models.Q(company__user=user)
        ).order_by('-created_at')
        
        customer_id = self.request.query_params.get('customer_id')
        company_id = self.request.query_params.get('company_id')
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if company_id:
            queryset = queryset.filter(company_id=company_id)
            
        return queryset.order_by('-created_at')
