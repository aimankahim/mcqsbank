from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),  # Make sure this matches your last migration
    ]

    operations = [
        migrations.RemoveField(
            model_name='pdfdocument',
            name='file',
        ),
        migrations.AddField(
            model_name='pdfdocument',
            name='content',
            field=models.BinaryField(default=b''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='pdfdocument',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                to='auth.user',
                default=1
            ),
            preserve_default=False,
        ),
    ] 