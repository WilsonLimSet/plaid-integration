# Generated by Django 5.0.7 on 2024-07-17 21:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('form', '0002_address_identity'),
    ]

    operations = [
        migrations.AlterField(
            model_name='identity',
            name='primary_address',
            field=models.TextField(),
        ),
        migrations.DeleteModel(
            name='Address',
        ),
    ]
