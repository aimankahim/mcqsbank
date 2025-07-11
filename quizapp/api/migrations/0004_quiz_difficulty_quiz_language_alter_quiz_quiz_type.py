# Generated by Django 5.1.7 on 2025-05-28 22:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_quiz_quiz_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='quiz',
            name='difficulty',
            field=models.CharField(choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')], default='medium', max_length=10),
        ),
        migrations.AddField(
            model_name='quiz',
            name='language',
            field=models.CharField(choices=[('en', 'English'), ('es', 'Spanish'), ('fr', 'French'), ('de', 'German'), ('zh', 'Chinese'), ('ja', 'Japanese'), ('ko', 'Korean'), ('ru', 'Russian'), ('ar', 'Arabic'), ('hi', 'Hindi')], default='en', max_length=2),
        ),
        migrations.AlterField(
            model_name='quiz',
            name='quiz_type',
            field=models.CharField(choices=[('multiple_choice', 'Multiple Choice'), ('true_false', 'True/False'), ('fill_in_blank', 'Fill in the Blank'), ('matching', 'Matching'), ('mixed', 'Mixed Types')], default='multiple_choice', max_length=20),
        ),
    ]
