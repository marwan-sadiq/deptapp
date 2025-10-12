from django.db import models
from django.contrib.auth.models import AbstractUser


class UserProfile(models.Model):
    """User profile model linked to Django's built-in User model"""
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_manager = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_userprofile'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"{self.user.username} ({self.user.email})"


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Customer(TimestampedModel):
    REPUTATION_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
        ('bad', 'Bad'),
    ]

    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='customers')
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=50, blank=True)
    address = models.CharField(max_length=255, blank=True)
    market_money = models.DecimalField(max_digits=15, decimal_places=3, default=0)
    total_debt = models.DecimalField(max_digits=15, decimal_places=3, default=0)
    reputation = models.CharField(max_length=20, choices=REPUTATION_CHOICES, default='fair')
    reputation_score = models.IntegerField(default=50)  # 0-100 scale
    last_payment_date = models.DateTimeField(null=True, blank=True)
    total_paid_30_days = models.DecimalField(max_digits=15, decimal_places=3, default=0)
    payment_streak_days = models.IntegerField(default=0)  # Consecutive days with payments

    def __str__(self) -> str:
        return self.name

    def update_reputation(self):
        """Update reputation based on payment behavior in last 30 days"""
        from django.utils import timezone
        from datetime import timedelta

        # 30 days period for production
        thirty_days_ago = timezone.now() - timedelta(days=30)

        # Get all debt payments in last 30 days
        recent_payments = self.debts.filter(
            created_at__gte=thirty_days_ago,
            amount__lt=0  # Negative amounts indicate payments
        )

        total_paid = abs(sum(p.amount for p in recent_payments))
        self.total_paid_30_days = total_paid

        # Calculate current total debt
        current_debt = sum(d.amount for d in self.debts.filter(is_settled=False))

        # Get the oldest unpaid debt to check if it's been 30+ days
        oldest_debt = self.debts.filter(is_settled=False).order_by('created_at').first()

        # Calculate reputation score (0-100)
        if current_debt == 0:
            # No debt = excellent
            self.reputation_score = 100
            self.reputation = 'excellent'
        elif oldest_debt and oldest_debt.created_at < thirty_days_ago:
            # Has debt older than 30 days - check payment behavior
            if total_paid > 0:
                # Has made payments - calculate based on payment ratio
                payment_ratio = float(total_paid) / float(current_debt + total_paid)
                if payment_ratio >= 0.5:  # Paid at least 50% of total debt
                    self.reputation_score = 80
                    self.reputation = 'good'
                elif payment_ratio >= 0.25:  # Paid at least 25%
                    self.reputation_score = 60
                    self.reputation = 'fair'
                else:  # Paid less than 25%
                    self.reputation_score = 30
                    self.reputation = 'poor'
            else:
                # Has debt older than 30 days with no payments = bad
                self.reputation_score = 10
                self.reputation = 'bad'
        else:
            # Has debt but it's less than 30 days old = good (new debt, give them time)
            # This gives new customers a fair chance before being penalized
            self.reputation_score = 70
            self.reputation = 'good'

        # Update last payment date
        if recent_payments.exists():
            self.last_payment_date = recent_payments.latest('created_at').created_at

        self.save()

    def can_receive_new_debt(self):
        """Check if customer can receive new debt based on payment history and due dates"""
        from django.utils import timezone
        from datetime import timedelta, date

        # 30 days period for production
        thirty_days_ago = timezone.now() - timedelta(days=30)
        today = date.today()

        # Check if customer has any positive debt (not overpaid)
        current_debt = sum(d.amount for d in self.debts.filter(is_settled=False))

        if current_debt <= 0:
            # No debt or overpaid = can receive new debt
            if current_debt < 0:
                return True, f"Customer is overpaid by ${abs(current_debt)} - can receive new debt"
            else:
                return True, "Customer has no debt"

        # Check if customer is new (created within last 30 days)
        # New customers get a grace period before payment requirements kick in
        if self.created_at and self.created_at > thirty_days_ago:
            # New customer - check only for overdue payments, not payment history
            overdue_debts = self.debts.filter(
                is_settled=False,
                due_date__isnull=False,
                due_date__lt=today
            )

            if overdue_debts.exists():
                # Has overdue payments = cannot receive new debt
                overdue_count = overdue_debts.count()
                return False, f"Customer has {overdue_count} overdue payment(s) - must pay before receiving new debt"
            else:
                # New customer with no overdue payments = can receive new debt
                return True, "New customer - can receive new debt"

        # For existing customers (created more than 30 days ago)
        # Check if customer has any overdue payments
        overdue_debts = self.debts.filter(
            is_settled=False,
            due_date__isnull=False,
            due_date__lt=today
        )

        if overdue_debts.exists():
            # Has overdue payments = cannot receive new debt
            overdue_count = overdue_debts.count()
            return False, f"Customer has {overdue_count} overdue payment(s) - must pay before receiving new debt"

        # Check if customer has made any payments in last 30 days
        recent_payments = self.debts.filter(
            created_at__gte=thirty_days_ago,
            amount__lt=0  # Negative amounts indicate payments
        )

        if recent_payments.exists():
            # Has made payments in last 30 days = can receive new debt
            total_paid = abs(sum(p.amount for p in recent_payments))
            return True, f"Customer paid ${total_paid} in last 30 days"
        else:
            # No payments in last 30 days = cannot receive new debt
            return False, "Customer has not made any payments in the last 30 days"

    def update_total_debt(self):
        """Update the total debt for this customer"""
        from django.db.models import Sum
        total = self.debts.aggregate(total=Sum('amount'))['total'] or 0
        self.total_debt = total
        self.save(update_fields=['total_debt'])

    def get_earliest_due_date(self):
        """Get the earliest due date among all debts for this customer"""
        earliest_debt = self.debts.filter(due_date__isnull=False).order_by('due_date').first()
        return earliest_debt.due_date if earliest_debt else None


class Company(TimestampedModel):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='companies')
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=50, blank=True)
    address = models.CharField(max_length=255, blank=True)
    market_money = models.DecimalField(max_digits=15, decimal_places=3, default=0)
    total_debt = models.DecimalField(max_digits=15, decimal_places=3, default=0)

    def __str__(self) -> str:
        return self.name

    def update_total_debt(self):
        """Update the total debt for this company"""
        from django.db.models import Sum
        total = self.debts.aggregate(total=Sum('amount'))['total'] or 0
        self.total_debt = total
        self.save(update_fields=['total_debt'])

    def get_earliest_due_date(self):
        """Get the earliest due date among all debts for this company"""
        earliest_debt = self.debts.filter(due_date__isnull=False).order_by('due_date').first()
        return earliest_debt.due_date if earliest_debt else None


class Debt(TimestampedModel):
    customer = models.ForeignKey('Customer', null=True, blank=True, on_delete=models.CASCADE, related_name='debts')
    company = models.ForeignKey('Company', null=True, blank=True, on_delete=models.CASCADE, related_name='debts')
    amount = models.DecimalField(max_digits=15, decimal_places=3)  # This is fine - keep it
    note = models.CharField(max_length=255, blank=True)
    is_settled = models.BooleanField(default=False)
    due_date = models.DateField(null=True, blank=True)

    def __str__(self) -> str:
        owner = self.customer.name if self.customer else (self.company.name if self.company else 'Unknown')
        return f"Debt {self.amount} for {owner}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update customer reputation and total debt when debt is created or updated
        if self.customer:
            self.customer.update_reputation()
            self.customer.update_total_debt()
        elif self.company:
            self.company.update_total_debt()

    class Meta:
        ordering = ['-created_at']


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ("create", "Create"),
        ("delete", "Delete"),
    )
    action = models.CharField(max_length=16, choices=ACTION_CHOICES)
    entity_type = models.CharField(max_length=32)  # 'customer' | 'company' | 'debt'
    entity_id = models.IntegerField()
    description = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class PaymentPlan(TimestampedModel):
    PRIORITY_CHOICES = [
        (1, 'High'),
        (2, 'Medium'),
        (3, 'Low'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True, related_name='payment_plans')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='payment_plans')
    total_debt = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_debt = models.DecimalField(max_digits=12, decimal_places=2)
    manual_priority = models.IntegerField(choices=PRIORITY_CHOICES, default=2)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        entity_name = self.customer.name if self.customer else self.company.name
        return f"Payment Plan for {entity_name} - ${self.remaining_debt}"

    class Meta:
        ordering = ['manual_priority', 'remaining_debt']


class PaymentSchedule(TimestampedModel):
    payment_plan = models.ForeignKey(PaymentPlan, on_delete=models.CASCADE, related_name='schedules')
    scheduled_date = models.DateField()
    scheduled_amount = models.DecimalField(max_digits=12, decimal_places=2)
    actual_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Payment {self.scheduled_date} - ${self.scheduled_amount}"

    class Meta:
        ordering = ['scheduled_date']


class DailyBalance(TimestampedModel):
    date = models.DateField(unique=True)
    available_amount = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.date} - ${self.available_amount}"

    class Meta:
        ordering = ['-date']


class ShopMoney(TimestampedModel):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='shop_money')
    current_money = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"Shop Money: ${self.current_money} for {self.user.username}"

    class Meta:
        ordering = ['-updated_at']
        unique_together = ['user']  # Each user can have only one shop money record


class EntityActivity(TimestampedModel):
    """Track all activities for customers and companies"""
    ACTIVITY_TYPES = [
        ('debt_created', 'Debt Created'),
        ('debt_updated', 'Debt Updated'),
        ('debt_deleted', 'Debt Deleted'),
        ('payment_made', 'Payment Made'),
        ('profile_created', 'Profile Created'),
        ('profile_updated', 'Profile Updated'),
        ('profile_deleted', 'Profile Deleted'),
    ]

    # Either customer or company must be set
    customer = models.ForeignKey('Customer', null=True, blank=True, on_delete=models.CASCADE, related_name='activities')
    company = models.ForeignKey('Company', null=True, blank=True, on_delete=models.CASCADE, related_name='activities')

    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)

    # Reference to the related object (debt, etc.)
    related_object_type = models.CharField(max_length=50, blank=True)  # 'debt', 'customer', 'company'
    related_object_id = models.IntegerField(null=True, blank=True)

    def __str__(self):
        entity_name = self.customer.name if self.customer else (self.company.name if self.company else 'Unknown')
        return f"{entity_name} - {self.get_activity_type_display()}: {self.description}"

    class Meta:
        ordering = ['-created_at']