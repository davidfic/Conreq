# Generated by Django 3.1.5 on 2021-01-13 06:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('settings', '0006_auto_20210112_2039'),
    ]

    operations = [
        migrations.AlterField(
            model_name='conreqconfig',
            name='conreq_app_url',
            field=models.URLField(),
        ),
        migrations.AlterField(
            model_name='conreqconfig',
            name='conreq_auto_resolve_issues',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='conreqconfig',
            name='conreq_custom_css',
            field=models.URLField(),
        ),
        migrations.AlterField(
            model_name='conreqconfig',
            name='email_smtp_server',
            field=models.URLField(),
        ),
        migrations.AlterField(
            model_name='conreqconfig',
            name='radarr_url',
            field=models.URLField(),
        ),
        migrations.AlterField(
            model_name='conreqconfig',
            name='sonarr_url',
            field=models.URLField(),
        ),
    ]