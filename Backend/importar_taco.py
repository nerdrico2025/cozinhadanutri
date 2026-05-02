import pandas as pd
import os
import django

# configurar django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cozinhadanutri.settings")
django.setup()

from alimentos.models import Alimento

# ler planilhas taco
df_macro = pd.read_excel("original-Taco_4a_edicao_2011 (REVISADA).xlsx", sheet_name=0, header=2)
df_ag = pd.read_excel("original-Taco_4a_edicao_2011 (REVISADA).xlsx", sheet_name='AGtaco3', header=2)

# remover espaços extras dos nomes das colunas
df_macro.columns = df_macro.columns.str.strip()
df_ag.columns = df_ag.columns.str.strip()

# Juntar os dados baseando no Número do Alimento
df_ag = df_ag.drop(columns=['Descri\u00e7\u00e3o dos alimentos'], errors='ignore')

# Renomeando as colunas pra lidar com eventuais problemas de encoding que vêm do Excel
df_macro = df_macro.rename(columns={df_macro.columns[0]: 'Numero do Alimento', df_macro.columns[1]: 'Descricao dos alimentos'})
df_ag = df_ag.rename(columns={df_ag.columns[0]: 'Numero do Alimento'})

df = df_macro.merge(df_ag, on='Numero do Alimento', how='left')

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
        numero = row['Numero do Alimento']

        # ignora linhas sem número
        if not str(numero).isdigit():
            continue

        descricao = row['Descricao dos alimentos']

        if pd.isna(descricao):
            continue

        kcal = limpar_valor(row['Energia (kcal)'])

        # se o alimento já existe, atualiza os dados, caso contrário, cria um novo registro
        Alimento.objects.update_or_create(
            numero=int(numero),
            defaults={
                'descricao': descricao,

                # nutrientes
                'energia_kcal': limpar_valor(row.get('Energia (kcal)')),
                'proteina': limpar_valor(row.get('Proteína (g)')),
                'lipideos': limpar_valor(row.get('Lipídeos (g)')),
                'carboidrato': limpar_valor(row.get('Carboidrato (g)')),
                'fibra_alimentar': limpar_valor(row.get('Fibra Alimentar (g)')),
                'umidade': limpar_valor(row.get('Umidade (%)')),

                # gorduras e sódio
                'saturados': limpar_valor(row.get('Saturados (g)')),
                'sodio': limpar_valor(row.get('Sódio (mg)')),
                'AG18_1t': limpar_valor(row.get('18:1t (g)')),
                'AG18_2t': limpar_valor(row.get('18:2t (g)')),

                # totais
                'acucares_totais': 0,
                'acucares_adicionados': 0,
                'vitaminas': 0,
                'minerais': 0,
            }
        )

        # Calculando minerais (mg para g) e vitaminas
        minerais_totais = sum([
            limpar_valor(row.get('Cálcio (mg)')) or 0,
            limpar_valor(row.get('Magnésio (mg)')) or 0,
            limpar_valor(row.get('Manganês (mg)')) or 0,
            limpar_valor(row.get('Fósforo (mg)')) or 0,
            limpar_valor(row.get('Ferro (mg)')) or 0,
            limpar_valor(row.get('Sódio (mg)')) or 0,
            limpar_valor(row.get('Potássio (mg)')) or 0,
            limpar_valor(row.get('Cobre (mg)')) or 0,
            limpar_valor(row.get('Zinco (mg)')) or 0
        ]) / 1000.0

        vitaminas_totais = sum([
            (limpar_valor(row.get('Retinol (mcg)')) or 0) / 1000.0,
            (limpar_valor(row.get('RE (mcg)')) or 0) / 1000.0,
            (limpar_valor(row.get('RAE  (mcg)')) or 0) / 1000.0,
            limpar_valor(row.get('Tiamina (mg)')) or 0,
            limpar_valor(row.get('Riboflavina (mg)')) or 0,
            limpar_valor(row.get('Piridoxina (mg)')) or 0,
            limpar_valor(row.get('Niacina (mg)')) or 0,
            limpar_valor(row.get('Vitamina C (mg)')) or 0
        ]) / 1000.0

        Alimento.objects.filter(numero=int(numero)).update(
            minerais=minerais_totais,
            vitaminas=vitaminas_totais
        )

    # mostra qual linha falhou mas não interrompe o script
    except Exception as e:
        desc = str(row.get('Descricao dos alimentos', 'Desconhecido'))
        print(f"Erro ao processar alimento {desc.encode('ascii', 'ignore').decode()}: {e}")

print("Importação finalizada!")