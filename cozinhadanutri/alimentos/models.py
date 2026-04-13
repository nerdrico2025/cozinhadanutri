from django.db import models

# Create your models here.

# lista do banco de dados do alimento, cada campo é um nutriente, e o valor é a quantidade do nutriente presente em 100g do alimento

class Alimento(models.Model):
    número = models.IntegerField(unique=True)
    descricao = models.CharField(max_length=255)
    
    umidade = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    energia_kcal = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    energia_kj = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    proteina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    lipideos = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    colesterol = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    carboidrato = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    fibra_alimentar = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    cinzas = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    calcio = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    magnesio = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    manganes = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    fosforo = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    ferro = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    sodio = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    potassio = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    cobre = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    zinco = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    retinol = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    re = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    rae = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    tiamina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    riboflavina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    piridoxina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    niacina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    vitamina_c = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)

    saturados = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    monoinsaturados = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    poliinsaturados = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG12_0 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG14_0 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG16_0 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG18_0 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG20_0 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG22_0 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG24_0 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG14_1 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG16_1 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG18_1 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG20_1 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG18_2_n6 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG18_3_n3 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG20_4 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG20_5 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG22_5 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG22_6 = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG18_1t = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG18_2t = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)

    triptofano = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    treonina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    isoleucina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    leucina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    lisina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    metionina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    cistina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    fenilalanina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    tirosina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    valina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    arginina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    histidina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    alanina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    ac_aspartico = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    ac_glutamico = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    glicina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    prolina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    serina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

class Meta:
    db_table = 'Alimento'
    ordering = ['número', 'descricao']
    verbose_name = 'Alimento'
    verbose_name_plural = 'Alimentos'

def __str__(self):
    return f'{self.numero} - {self.descricao}'


