# Generated by Django 5.0.7 on 2024-07-17 21:23

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('form', '0003_alter_identity_primary_address_delete_address'),
    ]

    operations = [
        migrations.CreateModel(
            name='Address',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('street', models.CharField(max_length=255)),
                ('city', models.CharField(max_length=255)),
                ('region', models.CharField(max_length=255)),
                ('postal_code', models.CharField(max_length=20)),
                ('country', models.CharField(max_length=255)),
            ],
        ),
        migrations.AlterField(
            model_name='identity',
            name='primary_address',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='form.address'),
        ),
    ]
