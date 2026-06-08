
def calcular_lupas(tabela_nutricional):
    return {
        "alto_acucar": tabela_nutricional.get("acucares_adicionados", 0) >= 15,
        "alto_gordura_saturada": tabela_nutricional.get("gorduras_saturadas", 0) >= 6,
        "alto_sodio": tabela_nutricional.get("sodio", 0) >= 600,
    }

