# Generated manually for renaming MarketMoney to ShopMoney

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_alter_marketmoney_user'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='MarketMoney',
            new_name='ShopMoney',
        ),
    ]
