# Generated by Django 3.2.9 on 2022-06-01 11:33

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('labels', '0016_entityspan_uuid'),
        ('data_export', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ExportedEntitySpan',
            fields=[
            ],
            options={
                'proxy': True,
                'indexes': [],
                'constraints': [],
            },
            bases=('labels.entityspan',),
        ),
    ]
