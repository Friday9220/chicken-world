// Chicken World – menukortet.
// Efter det trykte menukort (priser gældende 10. november 2026 – 30. april 2027).
// Ret priser her. Hver ret: [nr, navn, beskrivelse, priser, mærke]
// menu: 30 på en sektion giver hver ret en ekstra "Menu"-knap til prisen + 30 kr. (ikke tillæg).
// En menu er med pommes frites og sodavand (MENU_INFO nederst).
// priser er enten et tal eller en liste med én pris pr. størrelse (se "sizes").
// En ret kan have egne prisnavne som 6. felt, fx ['Pizza', '+ sodavand'].
// Tilkøb med samme "group" kan ikke vælges samtidig.
// 7. felt er valg i pop-up'en for netop den ret, fx { pick: { title: 'Vælg kød', options: [...] } } eller { drinks: [...] }.
// { ingr: [...] } i 7. felt bestemmer selv, hvad der kan fravælges (ellers bruges beskrivelsen).
// "lunch: true" betyder, at retterne kun kan bestilles mandag–fredag kl. 10–16.
// Tilvalg "Ekstra kød" på burgere, pita, bowls og ruller (ret prisen her)
var EXTRA_MEAT = { id: 'kod', name: 'Ekstra kød', price: 10 };
// Smørelse i pita og bowls (som på menukortet). "Uden smørelse" står sidst.
var SM_H = { pick: { title: 'Vælg smørelse', options: ['Haydari', 'Hummus', 'Uden smørelse'] } };
var SM_HT = { pick: { title: 'Vælg smørelse', options: ['Haydari', 'Tzatziki', 'Hummus', 'Uden smørelse'] } };
var SM_TH = { pick: { title: 'Vælg smørelse', options: ['Tzatziki', 'Haydari', 'Hummus', 'Uden smørelse'] } };

window.CW_MENU = [
  {
    id: 'frokost', title: 'Frokosttilbud', note: 'Mandag–fredag kl. 10–16', lunch: true,
    items: [
      ['', 'Sandwich: Kylling bacon', 'Kylling, bacon, salat, tomat, agurk og dressing', 39],
      ['', 'Sandwich: Spicy kylling', 'Spicy kylling, chilimayo, jalapeños, salat, tomat og agurk', 39],
      ['', 'Sandwich: Kylling & karry', 'Kylling, karry, bacon, salat, tomat og agurk', 39],
      ['', 'Sandwich: BBQ kylling', 'BBQ-kylling, bacon, ost, coleslaw og rå løg', 39],
      ['', 'Sandwich: Æg & rejer', 'Æg, rejer, salat, tomat, agurk og dressing', 39],
      ['', 'Sandwich: Tun', 'Tun, salat, tomat, agurk, løg og dressing', 39],
      ['', 'Sandwich: Skinke & ost', 'Skinke, ost, salat, tomat, agurk og dressing', 39],
      ['', 'Kyllingemix', 'Med pommes frites og husets dressing', 39],
      ['', 'Kebabmix', 'Med pommes frites og husets dressing', 39],
      ['', 'Frokostpizza: Skinke', 'Alm. størrelse', [35, 45], '', ['Pizza', '+ sodavand']],
      ['', 'Frokostpizza: Pepperoni', 'Alm. størrelse', [35, 45], '', ['Pizza', '+ sodavand']],
      ['', 'Frokostpizza: Kebab', 'Alm. størrelse', [35, 45], '', ['Pizza', '+ sodavand']],
      ['', 'Frokostpizza: Oksekød', 'Alm. størrelse', [35, 45], '', ['Pizza', '+ sodavand']]
    ]
  },
  {
    id: 'kylling', title: 'Kylling', note: 'Dansk kylling, marineret i mindst 24 timer',
    items: [
      ['', '½ kylling fra ovnen', 'Med coleslaw, agurkesalat og pommes frites eller ris', 110, '', null, { pick: { title: 'Vælg tilbehør', options: ['Pommes frites', 'Ris'] } }],
      ['', '½ kylling fra frituren', 'Med coleslaw, agurkesalat og pommes frites eller ris', 95, '', null, { pick: { title: 'Vælg tilbehør', options: ['Pommes frites', 'Ris'] } }],
      ['', 'Hel kylling', 'Hel grillet kylling på 1300 g', 129],
      ['', 'Marineret kyllingebryst', '200 g med bearnaisesauce, salat og pommes frites eller ris', 109, '', null, { pick: { title: 'Vælg tilbehør', options: ['Pommes frites', 'Ris'] } }],
      ['', '2 kyllingespyd', 'Med bearnaisesauce, salat og pommes frites eller ris', 109, '', null, { pick: { title: 'Vælg tilbehør', options: ['Pommes frites', 'Ris'] } }],
      ['', 'Box med crispy tenders', '5 crispy tenders med pommes frites', 89],
      ['', '2 personers menu', '2 halve kyllinger, 2 tenders, 2 tops, 2 mozzarellasticks, 2 nuggets, halvt ris og halvt pommes frites, coleslaw og pickles', 269, 'Til 2'],
      ['', 'Familiemenu', '4 halve kyllinger, 4 tenders, 4 tops, 4 mozzarellasticks, 4 nuggets, halvt ris og halvt pommes frites, 2 coleslaw og 2 pickles', 449, 'Til 4']
    ]
  },
  {
    id: 'burgere', title: 'Burgere', note: '150 g · alt kød fra Himmerland', menu: 30,
    extras: [EXTRA_MEAT],
    items: [
      ['', 'Kylling Bacon & Cheese', 'Grillet kyllingbryst, bacon, ost, salat, tomat, agurk, hjemmelavet dressing', 79],
      ['', 'Hamburger', 'Flamberet bøf, salat, agurk, tomat, syltede løg, ketchup, burgerdressing', 79],
      ['', 'BBQ Burger', 'Flamberet bøf, bløde løg, rå løg, salat, syltede agurker, ost, mild BBQ-dressing', 79],
      ['', 'Bearnaise Burger', 'Flamberet bøf, bløde løg, pickles, salat, ost, cremet bearnaisesauce', 79, 'Populær'],
      ['', 'Tops Burger', 'Flamberet bøf, ost, salat, tomat, agurk, syltede løg, spicy tops, burgerdressing', 79],
      ['', 'Hot Jalapeño Burger', 'Flamberet bøf, ost, iceberg salat, agurk, tomat, syltede løg, jalapeños, salsa, burgerdressing, nachochips', 79],
      ['', 'Bøfsandwich', 'Flamberet bøf, ketchup, remoulade, rødbeder, agurkesalat, rå løg, burgerdressing', 79],
      ['', 'Bacon Cheese Burger', 'Flamberet bøf, bacon, ost, salat, agurk, tomat, syltede løg, dressing, ketchup', 89],
      ['', 'Big Double Bacon Cheese', '2x flamberet bøf, ost, iceberg salat, agurk, tomat, rødløg, 2x bacon, ketchup, burgerdressing', 99],
      ['', 'RibbenSandwich', 'Smurt med salatmayo, fyldt med rødkål og frisk agurksalat', 55, '', null, { ingr: ['salatmayo', 'rødkål', 'frisk agurksalat'] }]
    ]
  },
  {
    id: 'pita', title: 'Pita', note: 'Hjemmelavet frisk pitabrød', menu: 30,
    extras: [EXTRA_MEAT],
    items: [
      ['', 'Crispy Fried Chicken', 'Crispy fried chicken, salat, tomat, agurk, peberfrugt, gulerødder, feta, syltede rødløg & kålmix, karrydressing, basilikumpesto', 79, '', null, SM_H],
      ['', 'Grillet Kylling', 'Grillet kyllingefilet, salat, tomat, agurk, peberfrugt, syltede rødløg & kålmix, urtedressing', 79, '', null, SM_TH],
      ['', 'Kebab', 'Kebab, salat, tomat, agurk, peberfrugt, syltede rødløg & kålmix, urtedressing', 79, '', null, SM_TH],
      ['', 'Grillet Oksebøf', 'Grillet hakkebøf, cheddarost, salat, tomat, agurk, syltede rødløg, peberfrugt, coleslaw, rødkål, hvidløgsdressing', 79, '', null, SM_HT],
      ['', 'Grillet Oksesteak', 'Grillet oksesteak, salat, tomat, agurk, peberfrugt, syltede rødløg, kålmix, urtedressing', 95, '', null, SM_TH],
      ['', 'Falafel (V)', 'Falafel, salat, tomat, agurk, syltede rødløg & kålmix, urtedressing', 69, 'Vegetar']
    ]
  },
  {
    id: 'bowls', title: 'Bowls', menu: 30,
    extras: [EXTRA_MEAT],
    pick: { title: 'Vælg ris, pommes frites eller salat', options: ['Ris', 'Pommes frites', 'Salat'] },
    items: [
      ['', 'Crispy Fried Chicken', 'Crispy fried chicken, salat, tomat, agurk, peberfrugt, gulerødder, feta, syltede rødløg & kålmix, karrydressing, basilikumpesto', 85, '', null, SM_H],
      ['', 'Grillet Kylling', 'Grillet kyllingefilet, salat, tomat, agurk, peberfrugt, syltede rødløg & kålmix, urtedressing', 85, '', null, SM_TH],
      ['', 'Kebab', 'Kebab, salat, tomat, agurk, peberfrugt, syltede rødløg & kålmix, urtedressing', 85, '', null, SM_TH],
      ['', 'Grillet Oksebøf', 'Grillet hakkebøf, cheddarost, salat, tomat, agurk, syltede rødløg, peberfrugt, coleslaw, rødkål, hvidløgsdressing', 85, '', null, SM_HT],
      ['', 'Grillet Oksesteak', 'Grillet oksesteak, salat, tomat, agurk, peberfrugt, syltede rødløg, kålmix, urtedressing', 95, '', null, SM_TH],
      ['', 'Falafel (V)', 'Falafel, salat, tomat, agurk, syltede rødløg & kålmix, urtedressing', 79, 'Vegetar']
    ]
  },
  {
    id: 'ruller', title: 'Ruller', note: 'Hjemmelavet friskbagt rullebrød', menu: 30,
    extras: [EXTRA_MEAT],
    pick: { title: 'Vælg olie', options: ['Chiliolie', 'Hvidløgsolie'] },
    items: [
      ['', 'Rulle m. Kebab', 'Kebab, iceberg salat, agurk, tomat, rødløg, dressing', 69],
      ['', 'Rulle m. Kylling', 'Grillet kylling, iceberg salat, agurk, tomat, rødløg, dressing', 69],
      ['', 'Rulle m. Crispy', 'Crispy chicken, iceberg salat, agurk, tomat, rødløg, dressing', 69],
      ['', 'Rulle m. Falafel', 'Falafel, iceberg salat, agurk, tomat, rødløg, dressing', 69, 'Vegetar']
    ]
  },
  {
    id: 'pizza', title: 'Pizza', note: 'Almindelig eller familie · ekstra kød eller ost 10,-', menu: 30,
    sizes: ['Alm.', 'Fam.'],
    items: [
      ['1', 'Margherita', 'Tomatsauce, ost', [50, 95]],
      ['2', 'Hawaii', 'Tomatsauce, ost, skinke, ananas, oregano', [79, 129]],
      ['3', 'Pepperoni', 'Tomatsauce, ost, pepperoni, oregano', [79, 129]],
      ['4', 'Chicken World Special', 'Tomatsauce, ost, kylling, pepperoni, kebab, majs', [79, 129], 'Husets egen'],
      ['5', 'Tuna', 'Tomatsauce, ost, tun, rejer, majs', [79, 129]],
      ['6', 'Meat Lover', 'Tomatsauce, ost, oksekød, skinke, bacon, rødløg', [79, 129]],
      ['7', 'BBQ Deluxe', 'BBQ-sauce, ost, oksekød, bacon, cocktailpølser', [79, 129]],
      ['8', 'Byg din egen pizza', 'Tomatsauce, ost og vælg dine yndlingsfyld (helt uden begrænsning) – skriv dit fyld i bemærkningen', [119, 199], '', null, { ingr: ['tomatsauce', 'ost'] }],
      ['9', 'Chicken Fresh', 'Tomatsauce, ost, kylling, champignon, friske tomater', [79, 129]],
      ['10', 'Salatpizza', 'Tomatsauce, ost, kebab eller kylling, frisk salat, agurk, tomat og valgfri dressing', [85, 150], '', null, { pick: { title: 'Vælg kød', options: ['Kebab', 'Kylling'] } }]
    ]
  },
  {
    id: 'grill', title: 'Grill & steg',
    items: [
      ['', 'Oksefilet steak', 'Ca. 200 g med salat, pommes frites og bearnaisesauce', 179],
      ['', 'Spareribs', '500 g med pommes frites og coleslaw', 149, '', null, { extras: [{ id: 'ribs', name: '1 x ekstra spareribs', price: 65, group: 'ribs' }, { id: 'ribs2', name: '2 x ekstra spareribs', price: 120, group: 'ribs' }] }],
      ['', '2 fiskefileter', 'Med pommes frites og remoulade', 79],
      ['', 'Skinkeschnitzel', '160 g med pommes frites og bearnaise', 95]
    ]
  },
  {
    id: 'boern', title: 'Børnemenu', note: 'Med pommes frites og juice', drinks: ['Tropical', 'Multijuice'],
    items: [
      ['', '2 tenders', '', 49],
      ['', '4 nuggets', '', 49],
      ['', 'Crispy burger', 'Kylling, salat og ketchup', 49]
    ]
  },
  {
    id: 'snacks', title: 'Snacks & tilbehør',
    items: [
      ['', 'Snackkurv lille', '2 af hver: mozzarellasticks, chili cheese tops, tenders og nuggets', 59],
      ['', 'Snackkurv stor', '4 af hver: mozzarellasticks, chili cheese tops, tenders og nuggets', 99],
      ['', 'Pommes frites lille', '', 25],
      ['', 'Pommes frites XL', '', 45],
      ['', 'World fries', 'Pommes frites med ostesauce og bacon', 59],
      ['', 'Kyllingemix', 'Med pommes frites og hjemmelavet dressing', 59],
      ['', 'Kebabmix', 'Med pommes frites og hjemmelavet dressing', 59],
      ['', 'Hotwings', '5 stk.', 49],
      ['', 'Tenders', '5 stk.', 49],
      ['', 'Chili cheese tops', '8 stk.', 39],
      ['', 'Mozzarellasticks', '8 stk.', 39],
      ['', 'Nuggets', '8 stk.', 39],
      ['', 'Pitabrød', '', 10],
      ['', 'Coleslaw', '', 15]
    ]
  },
  {
    id: 'dip', title: 'Dip',
    items: [
      ['', 'Mayo', '', 5],
      ['', 'Hvidløgsmayo', '', 5],
      ['', 'Chilimayo', '', 5],
      ['', 'Chili', '', 5],
      ['', 'BBQ', '', 5],
      ['', 'Ketchup', '', 5],
      ['', 'Remoulade', '', 5]
    ]
  },
  {
    id: 'drikke', title: 'Drikkevarer',
    items: [
      ['', 'Sodavand 0,33 l', '', 13],
      ['', 'Sodavand 1,5 l', '', 33, '', null, { drinks: ['Coca-Cola', 'Fanta', 'Pepsi Max', 'Faxe Kondi'] }]
      // Slush ice sælges kun om sommeren. Fjern // foran de to linjer (og sæt komma efter linjen ovenfor) for at vise dem igen:
      // ['', 'Slush ice 0,3 l', '', 10],
      // ['', 'Slush ice 0,5 l', '', 15]
    ]
  }
];

// Tilvalg, der kan vælges i en lille pop-up, når man lægger en pizza i kurven (gælder også frokostpizza). Billigst øverst.
window.CW_PIZZA_EXTRAS = [
  { id: 'chili', name: 'Chiliolie', price: 0 },
  { id: 'hvidlog', name: 'Hvidløgsolie', price: 0 },
  { id: 'dressing', name: 'Dressing', price: 5 },
  { id: 'ost', name: 'Ekstra ost', price: 10 },
  { id: 'kod', name: 'Ekstra kød', price: 10 }
];

// "pick" på en sektion: et valg kunden skal tage i pop-up'en, fx sauce i pitaen. Flere valg: en liste, fx [sauce, tilbehør].
// Tilføj nye muligheder sidst i en liste (kurve gemmer valget som nummer).
// En sektion kan have sin egen drikkeliste ("drinks"), fx juice i børnemenuen.
// Sodavand, man vælger i pop-up'en, når der følger en sodavand med (menu, frokost + sodavand, sodavand fra drikkevarer).
// Tilføj nye sodavand sidst i listen (kurve gemmer valget som nummer).
window.CW_SODAS = ['Coca-Cola', 'Fanta', 'Pepsi Max', 'Vand', 'Faxe Kondi'];

// Står i pop-up'en, når man bestiller en menu
window.CW_MENU_INFO = 'Menuen er med pommes frites og sodavand.';
