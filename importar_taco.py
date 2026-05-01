import pandas as pd
import os
import django

# configurar django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cozinhadanutri.settings")
django.setup()

from alimentos.models import Alimento

# ler planilha taco
df = pd.read_excel("original-Taco_4a_edicao_2011 (REVISADA).xlsx", header=2)

# remover espaços extras dos nomes das colunas
df.columns = df.columns.str.strip()

# função para limpar valores
def limpar_valor(valor):
    if pd.isna(valor):
        return None

    if isinstance(valor, str):
        valor = valor.strip()

        if valor in ["Tr", "*", ""]: # valores inválidos da taco
            return None

        # substituir vírgula por ponto para decimais
        valor = valor.replace(",", ".")

        try:
            return float(valor)
        except:
            return None

    return valor

for _, row in df.iterrows(): # percorrer cada linha da planilha
    try:
        numero = row['Número do Alimento']

        # ignora linhas sem número
        if not str(numero).isdigit():
            continue

        descricao = row['Descrição dos alimentos']

        if pd.isna(descricao):
            continue

        kcal = limpar_valor(row['Energia (kcal)'])

        # se o alimento já existe, atualiza os dados, caso contrário, cria um novo registro
        Alimento.objects.update_or_create(
            numero=int(numero),
            descricao=descricao,

            # nutrientes
            energia_kcal=limpar_valor(row.get('Energia (kcal)')),
            proteinas=limpar_valor(row.get('Proteína (g)')),
            gorduras_totais=limpar_valor(row.get('Lipídeos (g)')),
            carboidratos=limpar_valor(row.get('Carboidrato (g)')),
            fibra_alimentar=limpar_valor(row.get('Fibra Alimentar (g)')),
            
            # gorduras e sódio
            gorduras_saturadas=limpar_valor(row.get('Saturados (g)')),
            sodio=limpar_valor(row.get('Sódio (mg)')),
            
        )
    # mostra qual linha falhou mas não interrompe o script
    except Exception as e:
        print(f"Erro em {row.get('Descrição dos alimentos')} → {e}")

print("Importação finalizada!")