// Chicken World – menukortet.
// Skrevet af fra chicken-world.dk/menu (priser gældende 15. august – 31. december 2026).
// Ret priser her. Hver ret: [nr, navn, beskrivelse, priser, mærke]
// menu: 30 på en sektion giver hver ret en ekstra "Menu"-knap til prisen + 30 kr. (ikke tillæg).
// En menu er med pommes frites og sodavand (MENU_INFO nederst).
// priser er enten et tal eller en liste med én pris pr. størrelse (se "sizes").
// En ret kan have egne prisnavne som 6. felt, fx ['Pizza', '+ sodavand'].
// Tilkøb med samme "group" kan ikke vælges samtidig.
// 7. felt er valg i pop-up'en for netop den ret, fx { pick: { title: 'Vælg kød', options: [...] } } eller { drinks: [...] }.
// "lunch: true" betyder, at retterne kun kan bestilles mandag–fredag kl. 10–16.
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
      ['', 'Marineret kyllingebryst', '200 g med bearnaise, salat og pommes frites eller ris', 95, '', null, { pick: { title: 'Vælg tilbehør', options: ['Pommes frites', 'Ris'] } }],
      ['', '2 kyllingespyd', 'Med salat og pommes frites eller ris', 95, '', null, { pick: { title: 'Vælg tilbehør', options: ['Pommes frites', 'Ris'] } }],
      ['', 'Box med crispy tenders', '5 crispy tenders med pommes frites', 89],
      ['', '2 personers menu', '2 halve kyllinger, 2 tenders, 2 tops, 2 mozzarellasticks, 2 nuggets, halvt ris og halvt pommes frites, coleslaw og pickles', 269, 'Til 2'],
      ['', 'Familiemenu', '4 halve kyllinger, 4 tenders, 4 tops, 4 mozzarellasticks, 4 nuggets, halvt ris og halvt pommes frites, 2 coleslaw og 2 pickles', 449, 'Til 4']
    ]
  },
  {
    id: 'burgere', title: 'Burgere', note: '150 g oksekød fra Himmerland', menu: 30,
    items: [
      ['', 'Kylling bacon & cheese', 'Grillet kyllingebryst, bacon, ost, salat og husets dressing', 79],
      ['', 'Hamburger', 'Oksebøf, salat, tomat, agurk, syltede løg og ketchup', 79],
      ['', 'BBQ burger', 'Oksebøf, løg, pickles, ost og BBQ-dressing', 79],
      ['', 'Bearnaise burger', 'Oksebøf, løg, pickles, ost og bearnaise', 79, 'Populær'],
      ['', 'Tops burger', 'Oksebøf, ost, salat, spicy tops og burgerdressing', 79],
      ['', 'Hot jalapeño burger', 'Oksebøf, ost, jalapeños, salsa og nachochips', 79],
      ['', 'Bøfsandwich', 'Oksebøf, ketchup, remoulade, rødbeder, agurkesalat og rå løg', 79],
      ['', 'Bacon cheese burger', 'Oksebøf, bacon, ost og salat', 89],
      ['', 'Big double bacon cheese', '2 × 150 g oksebøf, dobbelt bacon og ost', 99],
      ['', 'Ribbensandwich', 'Ribbensteg, salatmayo, rødkål og agurkesalat', 55]
    ]
  },
  {
    id: 'pita', title: 'Pita', menu: 30,
    pick: { title: 'Vælg sauce', options: ['Haydari', 'Tzatziki', 'Hummus'] },
    items: [
      ['', 'Crispy fried chicken', 'Crispy kylling, salat, grønt, feta, syltede løg, kål, karrydressing og basilikumpesto', 79],
      ['', 'Grillet kylling', 'Grillet kyllingefilet, salat, grønt og urtedressing', 79],
      ['', 'Kebab', 'Kebab, salat, grønt, syltede løg, kål og urtedressing', 79],
      ['', 'Grillet oksebøf', 'Grillet hakket oksekød, cheddar, salat, grønt, coleslaw, rødkål og hvidløgsdressing', 79],
      ['', 'Grillet oksesteak', 'Grillet oksesteak, salat, grønt, feta og urtedressing', 95],
      ['', 'Falafel', 'Falafel, salat, grønt, syltede løg og urtedressing', 69, 'Vegetar']
    ]
  },
  {
    id: 'bowls', title: 'Bowls',
    pick: [
      { title: 'Vælg sauce', options: ['Haydari', 'Tzatziki', 'Hummus'] },
      { title: 'Vælg ris, pommes frites eller salat', options: ['Ris', 'Pommes frites', 'Salat'] }
    ],
    items: [
      ['', 'Crispy fried chicken bowl', 'Crispy kylling, salat, grønt, feta, syltede løg, kål, karrydressing og basilikumpesto', 85],
      ['', 'Grillet kylling bowl', 'Grillet kyllingefilet, salat, grønt og urtedressing', 85],
      ['', 'Kebab bowl', 'Kebab, salat, grønt, syltede løg, kål og urtedressing', 85],
      ['', 'Grillet oksebøf bowl', 'Grillet hakket oksekød, cheddar, salat, grønt, coleslaw, rødkål og hvidløgsdressing', 85],
      ['', 'Grillet oksesteak bowl', 'Grillet oksesteak, salat, grønt, feta og urtedressing', 95],
      ['', 'Falafel bowl', 'Falafel, salat, grønt, syltede løg og urtedressing', 79, 'Vegetar']
    ]
  },
  {
    id: 'ruller', title: 'Ruller', menu: 30,
    pick: { title: 'Vælg olie', options: ['Chiliolie', 'Hvidløgsolie'] },
    items: [
      ['', 'Rulle med kebab', '', 69],
      ['', 'Rulle med kylling', '', 69],
      ['', 'Rulle med crispy kylling', '', 69],
      ['', 'Rulle med falafel', '', 69, 'Vegetar']
    ]
  },
  {
    id: 'pizza', title: 'Pizza', note: 'Almindelig eller familie', menu: 30,
    sizes: ['Alm.', 'Fam.'],
    items: [
      ['1', 'Margherita', 'Tomatsauce og ost', [50, 95]],
      ['2', 'Hawaii', 'Skinke, ananas og oregano', [79, 129]],
      ['3', 'Pepperoni', 'Pepperoni og oregano', [79, 129]],
      ['4', 'Chicken World Special', 'Oksekød, kylling, pepperoni, kebab og majs', [79, 129], 'Husets egen'],
      ['5', 'Tuna', 'Tun, rejer og majs', [79, 129]],
      ['6', 'Meat Lover', 'Oksekød, skinke, bacon og rødløg', [79, 129]],
      ['7', 'BBQ Deluxe', 'Oksekød, bacon, cocktailpølser og BBQ-sauce', [79, 129]],
      ['8', 'Byg din egen', 'Skriv dit fyld i bemærkningen', [119, 199]],
      ['9', 'Chicken Fresh', 'Kylling, champignon og friske tomater', [79, 129]],
      ['10', 'Salatpizza', 'Kebab eller kylling, frisk salat, agurk, tomat og dressing', [85, 150], '', null, { pick: { title: 'Vælg kød', options: ['Kebab', 'Kylling'] } }]
    ]
  },
  {
    id: 'grill', title: 'Grill & steg',
    items: [
      ['', 'Oksefilet steak', 'Ca. 200 g med salat, pommes frites og bearnaise', 169],
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
      ['', 'World fries', 'Pommes frites med ostesauce og bacon', 55],
      ['', 'Kyllingemix', 'Med pommes frites og husets dressing', 55],
      ['', 'Kebabmix', 'Med pommes frites og husets dressing', 55],
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
  { id: 'kod', name: 'Ekstra kød', price: 15 }
];

// "pick" på en sektion: et valg kunden skal tage i pop-up'en, fx sauce i pitaen. Flere valg: en liste, fx [sauce, tilbehør].
// Tilføj nye muligheder sidst i en liste (kurve gemmer valget som nummer).
// En sektion kan have sin egen drikkeliste ("drinks"), fx juice i børnemenuen.
// Sodavand, man vælger i pop-up'en, når der følger en sodavand med (menu, frokost + sodavand, sodavand fra drikkevarer).
// Tilføj nye sodavand sidst i listen (kurve gemmer valget som nummer).
window.CW_SODAS = ['Coca-Cola', 'Fanta', 'Pepsi Max', 'Vand', 'Faxe Kondi'];

// Står i pop-up'en, når man bestiller en menu
window.CW_MENU_INFO = 'Menuen er med pommes frites og sodavand.';
