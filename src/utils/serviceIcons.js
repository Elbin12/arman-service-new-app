// utils/serviceIcons.js
export const getServiceIcon = (serviceName) => {
  const name = serviceName.toLowerCase();
  
  // Auto Detailing
  if (name.includes('auto detailing')) return '/Icons/Auto detailing/auto detailing.png';
  if (name.includes('fleet washing')) return '/Icons/Auto detailing/Fleet washing.png';
  
  // Barber
  if (name.includes('beard trim') || name.includes('shaping')) return '/Icons/Barber/Beard Trims and Shaping.png';
  if (name.includes('haircut')) return '/Icons/Barber/Haircut.png';
  if (name.includes('razor shave')) return '/Icons/Barber/Straight Razor Shaves.png';
  
  // Carpet Cleaning
  if (name.includes('carpet clean')) return '/Icons/Carpet cleaning/5. Carpet Cleaning.png';
  if (name.includes('rug clean')) return '/Icons/Carpet cleaning/6. area rug cleaning.png';
  if (name.includes('carpet patch')) return '/Icons/Carpet cleaning/carpet patching.svg';
  if (name.includes('carpet replace')) return '/Icons/Carpet cleaning/carpet replacement.png';
  if (name.includes('carpet seam')) return '/Icons/Carpet cleaning/carpet seam repair.png';
  if (name.includes('carpet stretch')) return '/Icons/Carpet cleaning/carpet stretching.png';
  
  // Chimney Services
  if (name.includes('chimney inspect')) return '/Icons/chimney services/chimney inspaction.png';
  if (name.includes('chimney sweep')) return '/Icons/chimney services/chimney sweeping.png';
  if (name.includes('heat flue')) return '/Icons/chimney services/heat flue sweep.png';
  
  // Duct Cleaning
  if (name.includes('air duct')) return '/Icons/Duct cleaning/4.air duct cleaning.png';
  if (name.includes('dryer vent')) return '/Icons/Duct cleaning/dryer vent cleaning.png';
  
  // Fence Services
  if (name.includes('fence install')) return '/Icons/Fence Services/fence installation.png';
  
  // Floor Refinishing
  if (name.includes('floor polish')) return '/Icons/Floor refinishing/Floor polishing.png';
  if (name.includes('floor refinish')) return '/Icons/Floor refinishing/Floor refinishing.png';
  if (name.includes('tile clean') || name.includes('stone clean')) return '/Icons/Floor refinishing/Tile and stone cleaning.png';
  if (name.includes('travertine')) return '/Icons/Floor refinishing/travertine cleaning.png';
  if (name.includes('wood floor')) return '/Icons/Floor refinishing/wood floor cleaning.png';
  
  // Granite
  if (name.includes('granite')) return '/Icons/Granite/Granite services.png';
  
  // Grill Cleaning
  if (name.includes('grill clean')) return '/Icons/Grill Cleaning/Grill Cleaning.png';
  if (name.includes('grill polish')) return '/Icons/Grill Cleaning/Grill Polish.png';
  if (name.includes('grill repair')) return '/Icons/Grill Cleaning/Grill repair.png';
  if (name.includes('grill replace')) return '/Icons/Grill Cleaning/Grill replacement.png';
  
  // Gutter Cleaning
  if (name.includes('gutter white')) return '/Icons/Gutter cleaning/14. Gutter Whitening.png';
  if (name.includes('gutter repair')) return '/Icons/Gutter cleaning/17. Gutter Repair.png';
  if (name.includes('gutter install')) return '/Icons/Gutter cleaning/23.gutter installation.png';
  if (name.includes('gutter clean')) return '/Icons/Gutter cleaning/7. gutter cleaning.png';
  if (name.includes('gutter guard')) return '/Icons/Gutter cleaning/8. Gutter guard installation.png';
  if (name.includes('drain system')) return '/Icons/Gutter cleaning/Drain system cleaning.png';
  if (name.includes('ice dam')) return '/Icons/Gutter cleaning/Ice dam removal.png';
  
  // Home Automation
  if (name.includes('camera install')) return '/Icons/Home Automation/Camera installation.png';
  if (name.includes('outdoor speaker')) return '/Icons/Home Automation/outdoor speaker installation.png';
  if (name.includes('tv mount')) return '/Icons/Home Automation/TV mounting and installation.png';
  if (name.includes('universal remote')) return '/Icons/Home Automation/universal remote programming.png';
  if (name.includes('wifi extend')) return '/Icons/Home Automation/Wifi Extendor.png';
  if (name.includes('cat5') || name.includes('cat6')) return '/Icons/Home Automation/Wire Installations (Cat5e).png';
  if (name.includes('coaxial')) return '/Icons/Home Automation/Wire Installations (Coaxial).png';
  if (name.includes('speaker') || name.includes('surround sound')) return '/Icons/Home Automation/Wire Installations (Speaker_Surround Sound).png';
  
  // HVAC
  if (name.includes('hvac ac')) return '/Icons/HVAC/HVAC AC Installation.png';
  if (name.includes('hvac furnace')) return '/Icons/HVAC/HVAC Furnace Installation.png';
  if (name.includes('hvac install')) return '/Icons/HVAC/HVAC installation.png';
  if (name.includes('hvac repair')) return '/Icons/HVAC/HVAC repair.png';
  if (name.includes('hvac replace')) return '/Icons/HVAC/HVAC replacement.png';
  if (name.includes('hvac tune')) return '/Icons/HVAC/HVAC Tune up.png';
  
  // Janitorial and Maid Services
  if (name.includes('ceiling fan')) return '/Icons/Janaturial and Maid Services/12.Ceiling fan cleaning.png';
  if (name.includes('maid service')) return '/Icons/Janaturial and Maid Services/3. Maid Services.png';
  if (name.includes('blind clean')) return '/Icons/Janaturial and Maid Services/9. blind cleaning.png';
  if (name.includes('high dust')) return '/Icons/Janaturial and Maid Services/high dusting.png';
  if (name.includes('janitorial')) return '/Icons/Janaturial and Maid Services/Janaturial services.png';
  if (name.includes('kitchen hood')) return '/Icons/Janaturial and Maid Services/kitchen hood cleaning.png';
  if (name.includes('light clean')) return '/Icons/Janaturial and Maid Services/light cleaning.png';
  if (name.includes('maintenance clean')) return '/Icons/Janaturial and Maid Services/maid service -maintenance cleaning.png';
  if (name.includes('oven clean')) return '/Icons/Janaturial and Maid Services/Oven cleaning.png';
  if (name.includes('post construct')) return '/Icons/Janaturial and Maid Services/post construction cleaning.png';
  if (name.includes('refrigerator')) return '/Icons/Janaturial and Maid Services/refrigrator cleaning.png';
  
  // Landscaping
  if (name.includes('arborist')) return '/Icons/landscaping and tree triming/arborist consultation.png';
  if (name.includes('garden')) return '/Icons/landscaping and tree triming/Garden Maintenance.png';
  if (name.includes('hedge')) return '/Icons/landscaping and tree triming/hedge trimming.png';
  if (name.includes('irrigation')) return '/Icons/landscaping and tree triming/Irrigation.png';
  if (name.includes('lawn care')) return '/Icons/landscaping and tree triming/Lawn care.png';
  if (name.includes('seeding')) return '/Icons/landscaping and tree triming/Seeding.png';
  if (name.includes('stump')) return '/Icons/landscaping and tree triming/Stump removal.png';
  if (name.includes('fertiliz')) return '/Icons/landscaping and tree triming/tree and schrub firtilizing.png';
  if (name.includes('tree disease') || name.includes('pest control')) return '/Icons/landscaping and tree triming/tree disease pest control.png';
  if (name.includes('tree removal')) return '/Icons/landscaping and tree triming/Tree Removal.png';
  if (name.includes('tree trim')) return '/Icons/landscaping and tree triming/tree trimming.png';
  if (name.includes('weed')) return '/Icons/landscaping and tree triming/weed control.png';
  
  // Light Installation
  if (name.includes('christmas light')) return '/Icons/light installation/Christmas lighting.png';
  if (name.includes('entertainment light')) return '/Icons/light installation/Entertainment lighting.png';
  if (name.includes('light install')) return '/Icons/light installation/light installation.png';
  
  // Others
  if (name.includes('custom')) return '/Icons/Others/Custom item.png';
  if (name.includes('other service')) return '/Icons/Others/Other Services.png';
  if (name.includes('snow')) return '/Icons/Others/Snow Shovel.png';
  if (name.includes('trash')) return '/Icons/Others/trash removal.png';
  if (name.includes('upholstery')) return '/Icons/Others/upholstrey cleaning.png';
  
  // Painting
  if (name.includes('cabinet paint')) return '/Icons/Painting/cabinet painting.png';
  if (name.includes('deck stain')) return '/Icons/Painting/Deck staining.png';
  if (name.includes('driveway seal')) return '/Icons/Painting/driveway seal coationg.svg';
  if (name.includes('drywall install')) return '/Icons/Painting/Drywall installation.png';
  if (name.includes('drywall repair')) return '/Icons/Painting/Drywall repair.png';
  if (name.includes('exterior paint')) return '/Icons/Painting/exterior painting.png';
  if (name.includes('interior paint')) return '/Icons/Painting/interior painting.png';
  if (name.includes('shower wall')) return '/Icons/Painting/Shower wall repair.png';
  if (name.includes('wallpaper install')) return '/Icons/Painting/wall paper installation.png';
  if (name.includes('wallpaper remove')) return '/Icons/Painting/wall paper removal.png';
  
  // Pest Control
  if (name.includes('pest control')) return '/Icons/Pest control/Pest Control.png';
  if (name.includes('bed bug')) return '/Icons/Pest control/pest- bed bug treatment.png';
  if (name.includes('bee control')) return '/Icons/Pest control/pest- bee control.png';
  if (name.includes('bird control')) return '/Icons/Pest control/pest-bird control.png';
  if (name.includes('termite')) return '/Icons/Pest control/termite inspection .png';
  
  // Pet Grooming
  if (name.includes('anal gland')) return '/Icons/Pet Grooming/Anal Gland Expression.png';
  if (name.includes('bathing')) return '/Icons/Pet Grooming/Bathing.png';
  if (name.includes('blueberry facial')) return '/Icons/Pet Grooming/Blueberry Facial.png';
  if (name.includes('deshedding')) return '/Icons/Pet Grooming/Deshedding.png';
  if (name.includes('ear clean')) return '/Icons/Pet Grooming/Ear Cleaning.png';
  if (name.includes('haircut') || name.includes('trimming')) return '/Icons/Pet Grooming/Haircut_Trimming.png';
  if (name.includes('nail care')) return '/Icons/Pet Grooming/nail care.png';
  if (name.includes('nail polish')) return '/Icons/Pet Grooming/Nail Polish.png';
  if (name.includes('teeth brush')) return '/Icons/Pet Grooming/teeth brushing.png';
  
  // Plumbing
  if (name.includes('fixture replace')) return '/Icons/Plumbing/plumbing- fixture replacement.png';
  if (name.includes('garbage disposal')) return '/Icons/Plumbing/plumbing- garbage disposal service.png';
  if (name.includes('plumbing hourly')) return '/Icons/Plumbing/plumbing- Hourly.png';
  if (name.includes('toilet replace')) return '/Icons/Plumbing/plumbing- toilet replacement.png';
  if (name.includes('valve replace')) return '/Icons/Plumbing/plumbing- valve replacement.png';
  if (name.includes('water heater')) return '/Icons/Plumbing/plumbing- water heater replacment.png';
  
  // Pool Services
  if (name.includes('pool filter')) return '/Icons/Pool Services/pool filter cleaning.png';
  if (name.includes('pool service')) return '/Icons/Pool Services/pool Service.png';
  
  // Pressure Washing
  if (name.includes('awning clean')) return '/Icons/pressure washing/10.awning cleaning.png';
  if (name.includes('driveway clean')) return '/Icons/pressure washing/11.driveway cleaning.png';
  if (name.includes('fence clean')) return '/Icons/pressure washing/13.fence cleaning.png';
  if (name.includes('house wash')) return '/Icons/pressure washing/2. House wash.png';
  if (name.includes('patio clean')) return '/Icons/pressure washing/20.patio cleaning.png';
  if (name.includes('roof clean')) return '/Icons/pressure washing/21.roof cleaning.png';
  if (name.includes('deck clean')) return '/Icons/pressure washing/Deck cleaning.png';
  if (name.includes('paver clean')) return '/Icons/pressure washing/Paver cleaning.png';
  if (name.includes('pressure wash')) return '/Icons/pressure washing/pressure washing.svg';
  if (name.includes('surface clean')) return '/Icons/pressure washing/Surface cleaner.png';
  
  // Roofing
  if (name.includes('roof repair')) return '/Icons/Roofing/Roof repair.png';
  if (name.includes('roof replace')) return '/Icons/Roofing/roof replacement.png';
  
  // Window Cleaning
  if (name.includes('window clean')) return '/Icons/window cleaning/1. window cleaning.png';
  if (name.includes('window screen repair')) return '/Icons/window cleaning/18. window screen repair.png';
  if (name.includes('window screen clean')) return '/Icons/window cleaning/19.window screen cleaning.png';
  if (name.includes('window track')) return '/Icons/window cleaning/22.window track detailing.png';
  if (name.includes('glass scratch')) return '/Icons/window cleaning/glass scratch removal.png';
  if (name.includes('mirror clean')) return '/Icons/window cleaning/Mirror cleaning.png';
  if (name.includes('solar panel')) return '/Icons/window cleaning/Solar panel cleaning.png';
  if (name.includes('window glass replace')) return '/Icons/window cleaning/window glass replacement.png';
  if (name.includes('window tint')) return '/Icons/window cleaning/Window Tinting.png';
  
  // Default fallback
  return '/Icons/Others/Other Services.png';
};