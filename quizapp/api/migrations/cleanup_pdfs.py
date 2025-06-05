from django.db import migrations, models

def delete_pdfs_without_user(apps, schema_editor):
    PDFDocument = apps.get_model('api', 'PDFDocument')
    # Delete all PDFs that don't have a user
    PDFDocument.objects.filter(user__isnull=True).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0001_initial'),  # Replace with your last migration
    ]

    operations = [
        migrations.RunPython(delete_pdfs_without_user),
        migrations.AlterField(
            model_name='pdfdocument',
            name='user',
            field=models.ForeignKey(
                on_delete=models.CASCADE,
                related_name='pdf_documents',
                to='auth.user'
            ),
        ),
    ] 