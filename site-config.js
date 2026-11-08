// Chicken World – fælles indstillinger for hjemmesiden.
// Ret åbningstider, levering og telefon her; menuen og forsiden bruger dem.
window.CW_CONFIG = {
  // Forbindelse til ordre-databasen (Supabase).
  // Nøglen er den offentlige "publishable"/"anon"-nøgle; den må gerne stå i koden.
  // Står felterne tomme, bliver kunden bedt om at ringe bestillingen ind.
  supabaseUrl: 'https://hxigjbaqfzepcefshsvm.supabase.co',
  supabaseKey: 'sb_publishable_XxlU3V4Riwzr4YhROSXuSg_L6ofND4I',

  name: 'Chicken World',
  phone: '21 98 88 50',
  phoneHref: 'tel:+4521988850',
  address: 'Banegårdspladsen 13, 8850 Bjerringbro',

  // Åbningstider pr. ugedag (0 = søndag). null = lukket. Tider i hele timer.
  hours: {
    0: null,
    1: [10, 20], 2: [10, 20], 3: [10, 20], 4: [10, 20],
    5: [10, 20],
    6: [12, 20]
  },
  // Onlinebestilling lukker så mange minutter før lukketid
  lastOrderMinutes: 15,
  // Hvor lang tid køkkenet ca. skal bruge
  prepMinutes: 20,

  // Frokosttilbud kan kun bestilles i dette tidsrum (mandag–fredag)
  lunch: { days: [1, 2, 3, 4, 5], from: 10, to: 16 },

  // Levering kan bestilles i hele åbningstiden (dog senest lastOrderMinutes før lukketid).
  // Levering: fee kr under freeFrom kr (gratis fra freeFrom). Over baseKm km fra butikken lægges perKm kr
  // på for hver km ud over baseKm – talt både ud og hjem. km = længste afstand vi leverer til.
  // Levering er gratis (fee 0, perKm 0). minOrder: levering kræver køb af mad for mindst så mange kr.
  // Vil I have gebyr igen: sæt fee (og evt. freeFrom = gratis fra kr.) og perKm = kr pr. km ud over baseKm.
  delivery: { fee: 0, freeFrom: 0, minOrder: 250, baseKm: 5, perKm: 0, roundTrip: true, km: 8, minutes: 45 }
};
