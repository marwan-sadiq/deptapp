from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (UserLoginView, UserLogoutView, UserProfileView, check_auth_status, cors_test,
                          CustomerViewSet, CompanyViewSet, DebtViewSet, AuditLogViewSet,
                          PaymentPlanViewSet, PaymentScheduleViewSet, DailyBalanceViewSet,
                          ShopMoneyViewSet, EntityActivityViewSet, CurrencyViewSet, generate_payment_plan, get_payment_schedule, 
                          mark_payment_completed, payment_analytics, update_all_reputations,
                          update_customer_reputation, check_customer_credit)


router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'companies', CompanyViewSet)
router.register(r'debts', DebtViewSet)
router.register(r'audit', AuditLogViewSet, basename='audit')
router.register(r'entity-activities', EntityActivityViewSet, basename='entity-activities')
router.register(r'payment-plans', PaymentPlanViewSet)
router.register(r'payment-schedules', PaymentScheduleViewSet)
router.register(r'daily-balances', DailyBalanceViewSet)
router.register(r'shop-money', ShopMoneyViewSet)
router.register(r'currencies', CurrencyViewSet)


urlpatterns = [
    # Authentication URLs
    path('auth/login/', UserLoginView.as_view(), name='user-login'),
    path('auth/logout/', UserLogoutView.as_view(), name='user-logout'),
    path('auth/profile/', UserProfileView.as_view(), name='user-profile'),
    path('auth/status/', check_auth_status, name='auth-status'),
    
    # CORS Test URL
    path('cors-test/', cors_test, name='cors-test'),
    
    # API URLs
    path('', include(router.urls)),
    path('generate-plan/', generate_payment_plan, name='generate-payment-plan'),
    path('schedule/', get_payment_schedule, name='get-payment-schedule'),
    path('mark-completed/<int:schedule_id>/', mark_payment_completed, name='mark-payment-completed'),
    path('analytics/', payment_analytics, name='payment-analytics'),
    path('update-all-reputations/', update_all_reputations, name='update-all-reputations'),
    path('update-customer-reputation/<int:customer_id>/', update_customer_reputation, name='update-customer-reputation'),
    path('check-customer-credit/<int:customer_id>/', check_customer_credit, name='check-customer-credit'),
]

