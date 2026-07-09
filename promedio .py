print("Calculadora de Notas Avanzada")
print("-" * 40)

# Ingreso de datos
ip = float(input("Ingrese Nota IP empresa: "))
ac = float(input("Ingrese nota de actitudes: "))
pa = float(input("Ingrese nota de participación: "))
tp = float(input("Ingrese nota de trabajo proyecto: "))

ep1 = float(input("Ingrese nota de examen parcial 1: "))
ep2 = float(input("Ingrese nota de examen parcial 2: "))
ep3 = float(input("Ingrese nota de examen parcial 3: "))

# Promedio de parciales
ep = (ep1 + ep2 + ep3) / 3

# --- CÁLCULOS ---

# 1. Puntos acumulados reales para la nota final (sobre el 70% del curso entregado)
puntos_en_el_bolsillo = (ip * 0.20) + (ac * 0.10) + (pa * 0.10) + (tp * 0.20) + (ep * 0.10)

# 2. Tu promedio actual de la plataforma (re-escalado al 100% de lo que se ha calificado)
# Como falta el 30% del Examen Final, lo avanzado hasta ahora representa el 70% (0.70)
promedio_actual_plataforma = puntos_en_el_bolsillo / 0.70

# 3. Nota necesaria para aprobar con 13 en el examen final (vale 30%)
na = 13
nota_necesaria_ef = (na - puntos_en_el_bolsillo) / 0.30

# --- RESULTADOS ---
print("-" * 40)
print(f"-> Tu promedio actual (Plataforma): {round(promedio_actual_plataforma, 1)}")
print(f"-> Puntos acumulados para la nota final: {round(puntos_en_el_bolsillo, 2)} de 14 posibles.")
print("-" * 40)

if nota_necesaria_ef <= 0:
    print("¡Ya aprobaste el semestre! No necesitas puntos en el examen final.")
elif nota_necesaria_ef > 20:
    print(f"Necesitas un {round(nota_necesaria_ef, 2)}. Matemáticamente ya no es posible alcanzar el 13.")
else:
    print(f"Para aprobar el semestre con 13, necesitas en tu Examen Final: {round(nota_necesaria_ef, 2)}")