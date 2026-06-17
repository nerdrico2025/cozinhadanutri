import pandas as pd
import os
import django

# configurar django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cozinhadanutri.settings")
django.setup()

from alimentos.models import Alimento

# ler planilhas taco
df_macro = pd.read_excel("original-Taco_4a_edicao_2011_(REVISADA_v2).xlsx", sheet_name=0, header=2)
df_ag = pd.read_excel("original-Taco_4a_edicao_2011_(REVISADA_v2).xlsx", sheet_name='AGtaco3', header=2)
df_ibge = pd.read_excel("tabela_ibge_v1_completa.xlsx", sheet_name="Página1", header=2)

# remover espaços extras dos nomes das colunas
df_macro.columns = df_macro.columns.str.strip()
df_ag.columns = df_ag.columns.str.strip()
df_ibge.columns = df_ibge.columns.str.strip()

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

        if valor in ["Tr", "*", "", "-"]: # valores inválidos das planilhas
            return None

        # substituir vírgula por ponto para decimais
        valor = valor.replace(",", ".")

        try:
            return float(valor)
        except:
            return None

    return valor

for _, row in df.iterrows(): # percorrer cada linha da planilha taco
    try:
        numero = row['Numero do Alimento']

        # ignora linhas sem número
        if not str(numero).isdigit():
            continue

        descricao = row['Descricao dos alimentos']

        if pd.isna(descricao):
            continue


        # se o alimento já existe, atualiza os dados, caso contrário, cria um novo registro
        Alimento.objects.update_or_create(
            numero=int(numero),
            defaults={
                'descricao': descricao,

                # nutrientes
                'energia_kcal': limpar_valor(row.get('Energia (kcal)')),
                'proteinas': limpar_valor(row.get('Proteína (g)')),
                'gorduras_totais': limpar_valor(row.get('Lipídeos (g)')),
                'carboidratos': limpar_valor(row.get('Carboidrato (g)')),
                'fibra_alimentar': limpar_valor(row.get('Fibra Alimentar (g)')),
                
                # gorduras e sódio
                'gorduras_saturadas': limpar_valor(row.get('Saturados (g)')),
                'sodio': limpar_valor(row.get('Sódio (mg)')),
                'gorduras_trans': (
                    (limpar_valor(row.get('18:1t (g)')) or 0) + (limpar_valor(row.get('18:2t (g)')) or 0)
                ),
                
                # açúcares
                'acucares_totais': limpar_valor(row.get('Açúcares Totais (g)')),
                'acucares_adicionados': limpar_valor(row.get('Açúcares Adicionados (g)')),
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

for _, row in df_ibge.iterrows(): # percorrer cada linha da planilha ibge
    try:
        numero = row['Número do Alimento']

        if pd.isna(numero):
            continue

        descricao = row['Descrição dos alimentos']

        if pd.isna(descricao):
            continue

        Alimento.objects.update_or_create(
            numero=int(numero),
            descricao=descricao,
            defaults={
                

                'energia_kcal': limpar_valor(row.get('Energia (kcal)')),
                'proteinas': limpar_valor(row.get('Proteína (g)')),
                'gorduras_totais': limpar_valor(row.get('Lipídeos (g)')),
                'carboidratos': limpar_valor(row.get('Carboidrato (g)')),
                'fibra_alimentar': limpar_valor(row.get('Fibra Alimentar (g)')),

                'gorduras_saturadas': limpar_valor(row.get('Gorduras Saturadas (g)')),
                'gorduras_trans': limpar_valor(row.get('Gorduras Trans (g)')),

                'sodio': limpar_valor(row.get('Sódio (mg)')),

                'acucares_totais': limpar_valor(row.get('Açúcares Totais (g)')),
                'acucares_adicionados': limpar_valor(row.get('Açúcares Adicionados (g)')),
            }
        )

    except Exception as e:
        desc = str(row.get('Descrição dos alimentos', 'Desconhecido'))
        print(f"Erro ao processar alimento {desc}: {e}")

print("Importação finalizada!")