from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, Customer, Company, Debt, AuditLog, PaymentPlan, PaymentSchedule, DailyBalance, ShopMoney, Currency


# User Profile Admin
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ('phone', 'is_manager')


class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('-date_joined',)


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'is_manager', 'created_at')
    list_filter = ('is_manager', 'created_at')
    search_fields = ('user__username', 'user__email', 'phone')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "user", "phone", "address", "total_debt", "reputation", "created_at")
    list_filter = ("user", "reputation", "created_at")
    search_fields = ("name", "phone", "user__username", "user__email")
    readonly_fields = ("total_debt", "reputation_score", "last_payment_date", "total_paid_30_days", "payment_streak_days")


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "user", "phone", "address", "total_debt", "created_at")
    list_filter = ("user", "created_at")
    search_fields = ("name", "phone", "user__username", "user__email")
    readonly_fields = ("total_debt",)


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'symbol', 'exchange_rate_to_iqd', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('code', 'name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = ("id", "amount", "currency", "customer", "company", "is_settled", "created_at")
    list_filter = ("is_settled", "currency")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "action", "entity_type", "entity_id", "amount", "created_at")
    list_filter = ("action", "entity_type")


@admin.register(PaymentPlan)
class PaymentPlanAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "company", "total_debt", "paid_amount", "remaining_debt", "manual_priority", "is_active")
    list_filter = ("manual_priority", "is_active")
    search_fields = ("customer__name", "company__name")


@admin.register(PaymentSchedule)
class PaymentScheduleAdmin(admin.ModelAdmin):
    list_display = ("id", "payment_plan", "scheduled_date", "scheduled_amount", "actual_amount", "is_paid", "paid_at")
    list_filter = ("is_paid", "scheduled_date")
    search_fields = ("payment_plan__customer__name", "payment_plan__company__name")


@admin.register(DailyBalance)
class DailyBalanceAdmin(admin.ModelAdmin):
    list_display = ("id", "date", "available_amount", "created_at")
    list_filter = ("date",)
    ordering = ("-date",)


@admin.register(ShopMoney)
class ShopMoneyAdmin(admin.ModelAdmin):
    list_display = ('user', 'current_money', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
