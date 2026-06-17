const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Member data from spreadsheet
const membersData = [
  { first_name: 'Antonio', last_name: 'Tupas, Jr.', country: 'Europe', organization: 'IBON International', email: '' },
  { first_name: 'Gizem', last_name: 'Başerüer-Oztürkan', country: 'Europe', organization: 'IBON Europe', email: 'gbasrueroztarkan@iboninternatonal.org' },
  { first_name: 'Michal', last_name: 'Brózgin', country: 'Europe', organization: 'IBON Europe', email: 'michal.brozgin@gmail.com' },
  { first_name: 'Chit', last_name: 'Ceballos', country: 'Asia', organization: 'IBON Philippines', email: '' },
  { first_name: 'Andres', last_name: 'Magdangal Naya Barrios', country: 'South America', organization: 'Instituto Politecnico Tomas', email: 'abarrios.uch@gmail.com' },
  { first_name: 'Martha', last_name: 'Noya Laguna', country: 'South America', organization: 'Centro Jurua Asourdy - ONG', email: 'mhoya13@hotmail.com' },
  { first_name: 'Juan', last_name: 'Lopez Inzunza', country: 'South America', organization: '', email: 'jlopezinzunza@gmail.com' },
  { first_name: 'Joyce', last_name: 'Valbuena', country: 'North America', organization: 'Centre for Philippine Concerns', email: 'valbuena.joyce@gmail.com' },
  { first_name: 'Ruilen', last_name: 'Jon Daly', country: 'North America', organization: 'Reality of Aid Network', email: 'rjdalen.daly@gmail.com' },
  { first_name: 'Nicolas', last_name: 'Guat Torres', country: 'Asia', organization: '', email: 'nguattorres@ibrc.org.do' },
  { first_name: 'Dimis', last_name: 'Mafaundez-Vargas Cáceres', country: 'Latin America', organization: 'FANPED', email: 'vargasdim22@hotmail.com' },
  { first_name: 'Marie', last_name: 'Guillard', country: 'Europe', organization: '', email: 'e.marie@hotmail.fr' },
  { first_name: 'Claude', last_name: 'Farget', country: 'Africa', organization: '', email: 'cfargat@ibonohq.fr' },
  { first_name: 'Iskandar', last_name: 'Hasari Masum', country: 'Asia', organization: 'Coastal Development Partnership', email: 'masum.cdp@yahoo.com' },
  { first_name: 'Riky', last_name: 'Arif', country: 'Asia', organization: 'Asia Pacific Students and Youth', email: 'rikyo.ari@gmail.com' },
  { first_name: 'Chernaish', last_name: 'Paguri', country: 'Asia', organization: 'APYVU', email: 'chernaish.paguri@gmail.com' },
  { first_name: 'Jisen', last_name: 'Yumilam', country: 'Asia', organization: 'Center for Research and Advocacy, Maringe', email: 'cra.maringe@gmail.com' },
  { first_name: 'Naiesan', last_name: 'Burnad Fathima', country: 'Asia', organization: 'Society for Rural Education and Development', email: 'imafimon@gmail.com' },
  { first_name: 'P.', last_name: 'Surly Rajini', country: 'Asia', organization: 'SAHANIVASA', email: 'sahanivasa45@gmail.com' },
  { first_name: 'Tisha', last_name: 'Prasad Saina', country: 'Asia', organization: '', email: 'tishadewsanai@gmail.com' },
  { first_name: 'Bonnie', last_name: 'Bethany', country: 'Africa', organization: 'Renaissance and Alternatives to Armaments', email: 'bonettie@gmail.com' },
  { first_name: 'Razan', last_name: 'Zauyler', country: 'Asia', organization: 'Globalization (IMG)', email: 'razan.zauyler@yahoo.com' },
  { first_name: 'Edward', last_name: 'Ongel', country: 'Africa', organization: 'SODNELT', email: 'edwardngel@yahoo.com' },
  { first_name: 'Njaka', last_name: 'Stacey Cyrus', country: 'Africa', organization: 'FAMAM', email: 'njaka.sc.org@gmail.com' },
  { first_name: 'Marlene', last_name: 'Francia', country: 'Africa', organization: '', email: 'marlenefrancia@gmail.com' },
  { first_name: 'Moses', last_name: 'Ochieng', country: 'Africa', organization: '', email: 'moses.ochieng@gmail.com' },
  { first_name: 'Oskar', last_name: 'Ole\'wan', country: 'Africa', organization: 'SEATINI Kenya', email: 'oskarewan@gmail.com' },
  { first_name: 'Prosigna', last_name: 'Okonkwo', country: 'Africa', organization: 'IBON International', email: 'prosigna29@gmail.com' },
  { first_name: 'Yves', last_name: 'Yreguia', country: 'Africa', organization: '', email: 'yves.ibon@gmail.com' },
  { first_name: 'Sofya', last_name: 'Khilchenko', country: 'Asia', organization: 'Forum of Women\'s NGOs of Kazakhstan', email: 'sofya@mail.com' },
  { first_name: 'Asilazuve', last_name: 'Chiara', country: 'Asia', organization: 'Nosh Vela Public Foundation', email: 'nash.wela@gmail.com' },
  { first_name: 'Jude', last_name: 'Smith', country: 'Europe', organization: 'PCTF Europe', email: 'jude.smith@pcef.eu' },
  { first_name: 'Sanjgie', last_name: 'Négeso (BOT)', country: 'Asia', organization: 'Pesticide Action Network Asia Pacific', email: 'sanjgie@panap.net' },
  { first_name: 'Giampiero', last_name: 'Giobedeschi', country: 'Europe', organization: 'Center for Human Rights and People', email: '' },
  { first_name: 'Maria Teresa', last_name: 'Singson-Ledeema', country: 'Europe', organization: 'Stichting Pray Holland; IWA; Participacio', email: 'malet.ledeema@gmail.com' },
  { first_name: 'Aira Talal', last_name: 'Sayeed', country: 'Asia', organization: 'Roots for Equity', email: 'aira.sayed@yahoo.com' },
  { first_name: 'Walli', last_name: 'Hussin', country: 'Asia', organization: '', email: 'wallihussin@yahoo.com' },
  { first_name: 'Anerino', last_name: 'Padilla', country: 'Asia', organization: '', email: 'anerino.padilla@protonmail.com' },
  { first_name: 'Roldan', last_name: 'Latuan (BOT)', country: 'Asia', organization: 'Moro-Christian Peoples Alliance', email: 'roldan@protonmail.org' },
  { first_name: 'Angella', last_name: 'Jimenez', country: 'Asia', organization: 'IBON International', email: 'hjimenez@iboninteratonal.org' },
  { first_name: 'Roy', last_name: 'Accson', country: 'Asia', organization: 'ASIAN COALITION BANK', email: 'accson@gmail.org' },
  { first_name: 'Aperitoria', last_name: 'Portales', country: 'Asia', organization: '', email: 'aperitoria@upc.org' },
  { first_name: 'Beverly', last_name: 'Longet (BOT)', country: 'Asia', organization: 'JPMSOL', email: 'lovnget.bev@gmail.org' },
  { first_name: 'Bisella', last_name: 'Frilles', country: 'Asia', organization: 'IBON INTERNATIONAL', email: 'bfrilles@idons.org' },
  { first_name: 'Cary', last_name: 'Agatha Caranp', country: 'Asia', organization: 'IBON International', email: 'caranpe@iboninterational.org' },
  { first_name: 'Christina', last_name: 'Francisco', country: 'Asia', organization: 'IBON International', email: 'cfrancisco@iboninterational.org' },
  { first_name: 'Cruz', last_name: 'L. de la (BOT)', country: 'Asia', organization: 'NJPT', email: 'cruzl@njpt.org' },
  { first_name: 'Delfa', last_name: 'Valderrama Garvino', country: 'Asia', organization: 'IBON International', email: '' },
  { first_name: 'Erin', last_name: 'Radit Palomares', country: 'Asia', organization: '', email: 'erinbhaliomares@gmail.com' },
  { first_name: 'Ermes', last_name: 'Espejo', country: 'Asia', organization: 'Citizen Charter Response Center', email: 'eespejo.crrc@gmail.org' },
  { first_name: 'Georgina', last_name: 'Esculler-del Castillo', country: 'Asia', organization: 'IBON International', email: 'esculler@iboninterational.org' },
  { first_name: 'Isai', last_name: 'Tami Locke', country: 'Asia', organization: 'IBON International', email: 'itamiLocke@iboninterational.org' },
  { first_name: 'Jasmine', last_name: 'Lumeda', country: 'Asia', organization: '', email: 'jlumeda@asrnet.org' },
  { first_name: 'Jean-Marie', last_name: 'Des Rosario Malondo', country: 'Asia', organization: 'IBON International', email: 'jmalondo@iboninterational.org' },
  { first_name: 'Jerson', last_name: 'Rosales', country: 'Asia', organization: '', email: 'jerson.rosales@yahoo.com' },
  { first_name: 'Jose', last_name: 'Enrique Atiea', country: 'Asia', organization: 'Iben Foundation', email: 'joenrique@iben.org' },
  { first_name: 'Joanna', last_name: 'Maya Supara', country: 'Asia', organization: 'Misong Ngo Vos', email: 'joanna.maya@mailyahoo.com' },
  { first_name: 'Lilanjo', last_name: 'Laurevo', country: 'Asia', organization: 'IBON International', email: 'maia_laurevo@yahoo.com' },
  { first_name: 'Lucia', last_name: 'Cowen', country: 'Asia', organization: '', email: 'lucia@cowen.info' },
  { first_name: 'Lyndon', last_name: 'Crabby Jr.', country: 'Asia', organization: 'IBON International', email: 'lcrabby.jr@iboninterational.org' },
  { first_name: 'Marc', last_name: 'Alfaro Intrado', country: 'Asia', organization: 'IBON International', email: 'mialcardo@iboninterational.org' },
  { first_name: 'Maria', last_name: 'Dimayoang', country: 'Asia', organization: 'IBON International', email: 'mdimayoang@iboninterational.org' },
  { first_name: 'Maria Fe', last_name: 'Tagbalas', country: 'Asia', organization: 'IBON International', email: 'peratagbalas@iboninterational.org' },
  { first_name: 'Maria Teresa', last_name: 'Dimayoang', country: 'Asia', organization: 'IBON International', email: 'mtdimayoang@iboninterational.org' },
  { first_name: 'Maria Theresa', last_name: 'Nena Lauron', country: 'Asia', organization: 'Rosa Luxemburg Stiftung', email: 'teset_lauron@yahoo.com' },
  { first_name: 'Marion', last_name: 'Pandiljan', country: 'Europe', organization: '', email: '' },
  { first_name: 'Mark', last_name: 'Ambit Percival', country: 'Europe', organization: '', email: 'marksm@gmail.com' },
  { first_name: 'Mil', last_name: 'Garcian (BOT)', country: 'Asia', organization: '', email: 'mil.garcian@gmail.com' },
  { first_name: 'Pio Verdola', last_name: 'Jr.', country: 'Asia', organization: 'Institute of Political Economy', email: 'pijoverdola@gmail.com' },
  { first_name: 'Rafa', last_name: 'Mahasan', country: 'Asia', organization: 'AMP', email: 'rafamahassan@yahoo.com' },
  { first_name: 'Raya', last_name: 'Montañosrios', country: 'Asia', organization: '', email: 'rayamrls@gmail.com' },
  { first_name: 'Ricky', last_name: 'Lodan', country: 'Asia', organization: 'IBON International', email: 'riordan@iboninterational.org' },
  { first_name: 'Risa', last_name: 'Villanueva', country: 'Asia', organization: 'CSO Partnership for Dev EMPOWERMENT', email: 'risa.villanueva@yahoo.com' },
  { first_name: 'Rodolfo', last_name: 'Lahay Jr.', country: 'Asia', organization: 'IBON International', email: 'jal.ahay@yahoo.com' },
  { first_name: 'Roland G.', last_name: 'Simbulan', country: 'Asia', organization: 'Center for Peoples Empowerment and Governance', email: 'rogsimbulan@gmail.com' },
  { first_name: 'Ronell', last_name: 'Villegas', country: 'Asia', organization: 'Cripin B. Beltran Resource Center', email: 'ronell@gmail.com' },
  { first_name: 'Roy', last_name: 'Aceunos', country: 'Africa', organization: 'IBON Africa', email: 'royaceunos@gmail.com' },
  { first_name: 'Sarit Isabelle', last_name: 'Torres', country: 'North America', organization: 'Reality of Aid Network-Asia Pacific', email: 'storres@realityofaid.org' },
  { first_name: 'Saifur', last_name: 'Aruhan Jamshed', country: 'Asia', organization: '', email: 'saifurajamshed@gmail.com' },
  { first_name: 'Sr Emelieno', last_name: 'Villegas', country: 'Asia', organization: 'Center for Trade Union and Human Rights', email: 'seay2218@gmail.com' },
  { first_name: 'Susan', last_name: 'Ong', country: 'Asia', organization: 'PEP Pilipinas Justice and Educ', email: 'susanong@gmail.com' },
  { first_name: 'Sylvia', last_name: 'Merced (BOT)', country: 'Asia', organization: 'PCFS', email: 'khabioul@gmail.com' },
  { first_name: 'Teofilo', last_name: 'Decasiaro', country: 'Asia', organization: 'IBON International', email: 'odecasiaro@iboninterational.org' },
  { first_name: 'Demba', last_name: 'Moussa Dembele (BOT)', country: 'Africa', organization: 'ARCADE', email: 'dembamoussa@arcadefrique.org' },
  { first_name: 'Mophasifane', last_name: 'Faye', country: 'Africa', organization: '', email: 'cifaye@yahoo.fr' },
  { first_name: 'Mustapha', last_name: 'Larme Ndoye', country: 'Africa', organization: 'Acord - Senegal', email: 'mlamine.ndoye@acordinternational.org' },
  { first_name: 'Alicia', last_name: 'Fernandez', country: 'Europe', organization: '', email: 'alicia2@hotmail.com' },
  { first_name: 'Fatima', last_name: 'Sade Musiger', country: 'Africa', organization: 'Former CFE staff', email: 'ulaparttansger@yahoo.com' },
  { first_name: 'Juan', last_name: 'Jara Vidal', country: 'Latin America', organization: 'Corporacion committee', email: 'jjara.vidal@gmail.com' },
  { first_name: 'Yaliye', last_name: 'Khamis Misargi', country: 'Africa', organization: 'Welfare Togo', email: 'akhamasidhi@hotmail.com / ashamusidis@hotmail.com' },
  { first_name: 'Kumessi', last_name: 'Yamovi Evemutive', country: 'Togo', organization: 'Centr d\'Action pour le Development Rural', email: 'max.evemutive@yahoo.fr/direction' },
  { first_name: 'Helen Grace', last_name: 'Alwell-Wangusa', country: 'Africa', organization: 'Council of Anglican Provinces of Africa', email: 'helen@capa.org' },
  { first_name: 'Bryan', last_name: 'Zake', country: 'North America', organization: '', email: 'bryzake@gmail.com' },
  { first_name: 'Truong', last_name: 'Quoc Can', country: 'Asia', organization: 'SRD', email: 'cantruong@gmail.com' },
  { first_name: 'Emmanuella', last_name: 'Yana Chikoya', country: 'Africa', organization: 'Council of Churches in Zambia', email: 'chikoya@gmail.com' },
];

async function importMembers() {
  try {
    console.log('🔍 Checking existing members...');
    
    // Get all members to check which ones need numbers
    const { data: allMembers, error: queryError } = await supabase
      .from('members')
      .select('id, member_number, first_name, last_name');

    if (queryError) {
      console.error('Error querying members:', queryError);
      process.exit(1);
    }

    console.log(`📊 Found ${allMembers.length} existing members`);
    
    // Find the highest member number
    let maxNumber = 0;
    allMembers.forEach(m => {
      if (m.member_number) {
        const match = m.member_number.match(/MEM-2026-(\d+)/);
        if (match) {
          maxNumber = Math.max(maxNumber, parseInt(match[1]));
        }
      }
    });

    let nextNumber = maxNumber + 1;
    console.log(`📊 Highest member number: MEM-2026-${String(maxNumber).padStart(5, '0')}`);
    console.log(`📝 Starting new numbers from: MEM-2026-${String(nextNumber).padStart(5, '0')}\n`);

    // Prepare batch insert
    const membersToInsert = membersData.map((member, index) => {
      const memberNumber = String(nextNumber + index).padStart(5, '0');
      return {
        member_number: `MEM-2026-${memberNumber}`,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email || null,
        country: member.country || 'Philippines',
        organization: member.organization || null,
        membership_type: 'regular',
        status: 'active',
        date_admitted: new Date().toISOString().split('T')[0],
        notes: null,
        avatar_url: null,
      };
    });

    console.log(`📝 Importing ${membersToInsert.length} new members...\n`);

    // Insert in batches of 50
    const batchSize = 50;
    for (let i = 0; i < membersToInsert.length; i += batchSize) {
      const batch = membersToInsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('members')
        .insert(batch);

      if (error) {
        console.error(`❌ Batch ${i / batchSize + 1} failed:`, error);
        process.exit(1);
      }

      console.log(`✅ Batch ${i / batchSize + 1} imported (${batch.length} members)`);
    }

    console.log(`\n✨ Successfully imported ${membersToInsert.length} new members!`);
    console.log(`📌 Member numbers: MEM-2026-${String(nextNumber).padStart(5, '0')} to MEM-2026-${String(nextNumber + membersToInsert.length - 1).padStart(5, '0')}`);
    console.log(`📊 Total members in system: ${allMembers.length + membersToInsert.length}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importMembers();
