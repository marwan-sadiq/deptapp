from decimal import Decimal
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from .models import PaymentPlan, PaymentSchedule, DailyBalance, Customer, Company


class PaymentPlanner:
    """
    Payment planning algorithm that prioritizes debts by amount (highest first).
    Simple and logical: bigger debts get paid first.
    """
    
    def __init__(self):
        # Priority weights (1 = highest, 3 = lowest)
        self.priority_weights = {1: 3.0, 2: 2.0, 3: 1.0}
    
    def calculate_debt_priority(self, total_debt: Decimal, paid_amount: Decimal, 
                              manual_priority: int) -> float:
        """
        Calculate priority score for a debt.
        Optimized for supermarkets with many suppliers - spreads payments across 8-12 companies daily.
        Priority is based on:
        1. Manual priority (if set by user)
        2. Remaining debt amount (balanced to avoid one company dominating)
        """
        remaining_debt = total_debt - paid_amount
        if remaining_debt <= 0:
            return 0.0
        
        # Get base priority weight (1=high, 2=medium, 3=low)
        base_weight = self.priority_weights.get(manual_priority, 2.0)
        
        # Use logarithmic scale to balance distribution across many companies
        # This ensures 8-12 companies get paid each day instead of just 1-2
        # log10(10000) = 4, log10(100) = 2, log10(1000) = 3
        import math
        debt_amount_score = math.log10(max(float(remaining_debt), 1)) + 1
        
        # Final score: multiply base priority by logarithmic debt amount
        final_score = base_weight * debt_amount_score
        
        return final_score
    
    def generate_payment_plan(self, daily_balances: Dict[str, Decimal], 
                            debts: List[Dict]) -> Dict:
        """
        Generate payment plan prioritizing by debt amount.
        
        Args:
            daily_balances: Dict with date strings as keys and available amounts as values
            debts: List of debt dictionaries with company, totalDebt, paid, manualPriority
        
        Returns:
            Dict containing payment plans and schedules
        """
        # Sort dates chronologically
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
        total_scheduled = Decimal('0')
        
        for date_str in sorted_dates:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            available_amount = daily_balances[date_str]
            
            if available_amount <= 0:
                continue
            
            # Calculate priority scores for all debts with remaining balance
            debt_priorities = []
            for plan in payment_plans:
                if plan.remaining_debt > 0:
                    priority_score = self.calculate_debt_priority(
                        plan.total_debt, 
                        plan.paid_amount, 
                        plan.manual_priority
                    )
                    debt_priorities.append((plan, priority_score))
            
            # Sort by priority score (HIGHEST FIRST)
            # This means largest debts with high priority come first
            debt_priorities.sort(key=lambda x: x[1], reverse=True)
            
            # Calculate total priority weight for proportional distribution
            total_priority_weight = sum(score for _, score in debt_priorities)
            
            if total_priority_weight > 0:
                # Distribute money proportionally based on priority scores
                for plan, priority_score in debt_priorities:
                    # Calculate proportional share of available money
                    # Higher priority = larger share
                    proportion = priority_score / total_priority_weight
                    allocated_amount = available_amount * Decimal(str(proportion))
                    
                    # Don't pay more than remaining debt
                    payment_amount = min(allocated_amount, plan.remaining_debt)
                    
                    if payment_amount > 0:
                        # Round to 2 decimal places
                        payment_amount = payment_amount.quantize(Decimal('0.01'))
                        
                        # Create payment schedule
                        schedule = PaymentSchedule(
                            payment_plan=plan,
                            scheduled_date=date,
                            scheduled_amount=payment_amount,
                            is_paid=False
                        )
                        schedules.append(schedule)
                        
                        # Update remaining amounts
                        plan.remaining_debt -= payment_amount
                        plan.paid_amount += payment_amount
                        total_scheduled += payment_amount
        
        # Calculate total available money
        total_available = sum(daily_balances.values())
        
        return {
            'payment_plans': payment_plans,
            'schedules': schedules,
            'total_scheduled': total_scheduled,
            'total_available': total_available,
            'utilization_rate': float(total_scheduled / total_available) if total_available > 0 else 0
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
        
        # Create new company if not found
        return Company.objects.create(name=entity_name)