from decimal import Decimal
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from .models import PaymentPlan, PaymentSchedule, DailyBalance, Customer, Company


class PaymentPlanner:
    """
    Advanced payment planning algorithm that generates fair daily payment schedules
    based on available money, priority, and debt size.
    """
    
    def __init__(self):
        self.priority_weights = {1: 3.0, 2: 2.0, 3: 1.0}  # High, Medium, Low
    
    def calculate_debt_priority(self, total_debt: Decimal, paid_amount: Decimal, 
                              manual_priority: int, days_overdue: int = 0) -> float:
        """
        Calculate dynamic priority score for a debt.
        Higher score = higher priority for payment.
        """
        remaining_debt = total_debt - paid_amount
        if remaining_debt <= 0:
            return 0.0
        
        # Base priority from manual setting
        base_priority = self.priority_weights.get(manual_priority, 2.0)
        
        # Debt size factor (larger debts get slightly higher priority)
        debt_size_factor = min(1.5, float(remaining_debt) / 10000)  # Cap at 1.5x
        
        # Overdue factor (overdue debts get higher priority)
        overdue_factor = 1.0 + (days_overdue * 0.1)  # 10% increase per day overdue
        
        # Urgency factor (debts closer to completion get priority)
        completion_ratio = float(paid_amount) / float(total_debt) if total_debt > 0 else 0
        urgency_factor = 1.0 + (completion_ratio * 0.5)  # Up to 50% boost for near-completion
        
        return base_priority * debt_size_factor * overdue_factor * urgency_factor
    
    def generate_payment_plan(self, daily_balances: Dict[str, Decimal], 
                            debts: List[Dict]) -> Dict:
        """
        Generate a comprehensive payment plan based on available daily balances and debts.
        
        Args:
            daily_balances: Dict with date strings as keys and available amounts as values
            debts: List of debt dictionaries with company, totalDebt, paid, manualPriority
        
        Returns:
            Dict containing payment plans and schedules
        """
        # Sort dates
        sorted_dates = sorted(daily_balances.keys())
        
        # Create payment plans for each debt
        payment_plans = []
        for debt in debts:
            # Find or create customer/company
            entity = self._get_or_create_entity(debt)
            
            # Calculate remaining debt
            remaining_debt = Decimal(str(debt['totalDebt'])) - Decimal(str(debt['paid']))
            
            if remaining_debt > 0:
                plan = PaymentPlan(
                    customer=entity if isinstance(entity, Customer) else None,
                    company=entity if isinstance(entity, Company) else None,
                    total_debt=Decimal(str(debt['totalDebt'])),
                    paid_amount=Decimal(str(debt['paid'])),
                    remaining_debt=remaining_debt,
                    manual_priority=debt.get('manualPriority', 2),
                    is_active=True
                )
                payment_plans.append(plan)
        
        # Generate daily payment schedules
        schedules = []
        for date_str in sorted_dates:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            available_amount = daily_balances[date_str]
            
            if available_amount <= 0:
                continue
            
            # Calculate priorities for this day
            debt_priorities = []
            for plan in payment_plans:
                if plan.remaining_debt > 0:
                    # Calculate days overdue (simplified - could be enhanced)
                    days_overdue = 0  # Could calculate based on due dates
                    
                    priority_score = self.calculate_debt_priority(
                        plan.total_debt, plan.paid_amount, 
                        plan.manual_priority, days_overdue
                    )
                    
                    debt_priorities.append((plan, priority_score))
            
            # Sort by priority (highest first)
            debt_priorities.sort(key=lambda x: x[1], reverse=True)
            
            # Distribute available amount
            remaining_amount = available_amount
            for plan, priority_score in debt_priorities:
                if remaining_amount <= 0:
                    break
                
                # Calculate payment amount for this debt
                payment_amount = self._calculate_payment_amount(
                    plan, remaining_amount, priority_score, debt_priorities
                )
                
                if payment_amount > 0:
                    # Create payment schedule
                    schedule = PaymentSchedule(
                        payment_plan=plan,
                        scheduled_date=date,
                        scheduled_amount=payment_amount,
                        is_paid=False
                    )
                    schedules.append(schedule)
                    
                    # Update remaining amounts
                    remaining_amount -= payment_amount
                    plan.remaining_debt -= payment_amount
                    plan.paid_amount += payment_amount
        
        return {
            'payment_plans': payment_plans,
            'schedules': schedules,
            'total_scheduled': sum(s.scheduled_amount for s in schedules),
            'total_available': sum(daily_balances.values()),
            'utilization_rate': sum(s.scheduled_amount for s in schedules) / sum(daily_balances.values()) if sum(daily_balances.values()) > 0 else 0
        }
    
    def _get_or_create_entity(self, debt: Dict):
        """Get or create customer/company entity from debt data."""
        entity_name = debt.get('company', debt.get('customer', 'Unknown'))
        
        # Try to find existing company first
        try:
            return Company.objects.get(name=entity_name)
        except Company.DoesNotExist:
            pass
        
        # Try to find existing customer
        try:
            return Customer.objects.get(name=entity_name)
        except Customer.DoesNotExist:
            pass
        
        # Create new company (assuming it's a company if not specified)
        return Company.objects.create(name=entity_name)
    
    def _calculate_payment_amount(self, plan: PaymentPlan, available_amount: Decimal, 
                                priority_score: float, all_priorities: List[Tuple]) -> Decimal:
        """
        Calculate how much to pay for a specific debt on a given day.
        Uses proportional distribution based on priority and remaining debt.
        """
        if plan.remaining_debt <= 0 or available_amount <= 0:
            return Decimal('0')
        
        # Calculate total priority weight for all remaining debts
        total_weight = sum(score for _, score in all_priorities)
        
        if total_weight == 0:
            return Decimal('0')
        
        # Calculate proportional amount based on priority
        proportional_amount = (priority_score / total_weight) * available_amount
        
        # Don't exceed remaining debt
        payment_amount = min(proportional_amount, plan.remaining_debt)
        
        # Round to 2 decimal places
        return payment_amount.quantize(Decimal('0.01'))
    
    def optimize_schedule(self, schedules: List[PaymentSchedule]) -> List[PaymentSchedule]:
        """
        Optimize the payment schedule to minimize the number of partial payments
        and maximize debt completion.
        """
        # Group schedules by payment plan
        plan_schedules = {}
        for schedule in schedules:
            plan_id = schedule.payment_plan.id
            if plan_id not in plan_schedules:
                plan_schedules[plan_id] = []
            plan_schedules[plan_id].append(schedule)
        
        optimized_schedules = []
        
        for plan_id, plan_schedule_list in plan_schedules.items():
            # Sort by date
            plan_schedule_list.sort(key=lambda x: x.scheduled_date)
            
            # Try to consolidate payments
            consolidated = self._consolidate_payments(plan_schedule_list)
            optimized_schedules.extend(consolidated)
        
        return optimized_schedules
    
    def _consolidate_payments(self, schedules: List[PaymentSchedule]) -> List[PaymentSchedule]:
        """
        Consolidate multiple small payments into fewer, larger payments when possible.
        """
        if len(schedules) <= 1:
            return schedules
        
        # Group consecutive days
        consolidated = []
        current_group = [schedules[0]]
        
        for i in range(1, len(schedules)):
            current_schedule = schedules[i]
            last_schedule = current_group[-1]
            
            # If consecutive days and small amounts, group them
            days_diff = (current_schedule.scheduled_date - last_schedule.scheduled_date).days
            if days_diff <= 2:  # Within 2 days
                current_group.append(current_schedule)
            else:
                # Process current group and start new one
                consolidated.extend(self._merge_group(current_group))
                current_group = [current_schedule]
        
        # Process final group
        consolidated.extend(self._merge_group(current_group))
        
        return consolidated
    
    def _merge_group(self, schedules: List[PaymentSchedule]) -> List[PaymentSchedule]:
        """
        Merge a group of schedules into fewer, more efficient payments.
        """
        if len(schedules) <= 1:
            return schedules
        
        # Calculate total amount
        total_amount = sum(s.scheduled_amount for s in schedules)
        
        # If total is small, keep as is
        if total_amount < Decimal('50'):
            return schedules
        
        # Create consolidated payment on the first day
        first_schedule = schedules[0]
        first_schedule.scheduled_amount = total_amount
        
        # Mark others for deletion (in real implementation, you'd delete them)
        return [first_schedule]
