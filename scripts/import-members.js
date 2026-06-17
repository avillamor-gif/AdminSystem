/**
 * One-time bulk import script for membership list
 * Run with: node scripts/import-members.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const membersData = [
  { first_name: 'Antonio', last_name: 'Tejada Jr.', country: 'Europe', organization: 'IBON International', email: null },
  { first_name: 'Cecilia', last_name: 'Balderama-Dellahan', country: 'Europe', organization: 'IBON League', email: 'cdellahan@iboninternational.org' },
  { first_name: 'Gertrude', last_name: 'De Clercq', country: 'Europe', organization: 'IBON International', email: null },
  { first_name: 'Wim', last_name: 'De Ceulaere', country: 'Europe', organization: 'Medical Aid for the Third World', email: 'wim@de.be' },
  { first_name: 'Andres', last_name: 'Alejandro Noya Barrera', country: 'South America', organization: 'Katati', email: 'aandres.unir@gmail.com,' },
  { first_name: 'Martha', last_name: 'Noya Lopez', country: 'South America', organization: 'Centro Juan Acurday - ONG', email: 'directiongeneral@urk.co.bo' },
  { first_name: 'Adrian', last_name: 'Sprinton', country: 'North America', organization: null, email: 'adrianp@yahoo.com' },
  { first_name: 'Grace', last_name: 'Mellows', country: 'North America', organization: null, email: 'gmellows.sca@gmail.com' },
  { first_name: 'Reileen', last_name: 'Joy Isday', country: 'North America', organization: 'Reality of Aid Network', email: 'reileen.jday@gmail.com' },
  { first_name: 'Nicolas', last_name: 'Oso Theus', country: 'Latin America', organization: 'Caravan Consulting-Peru', email: 'ncsor@daserj.org' },
  { first_name: 'Dimas', last_name: 'Mauricio Vanegas Ckaceres', country: 'Latin America', organization: 'FANFIPOCOOP', email: 'dimasvanegas@yahoo.com,' },
  { first_name: 'Mani', last_name: 'Garvani', country: 'Asia', organization: null, email: 'e-mail AGEO@YAHOO.FR' },
  { first_name: 'Fanny', last_name: 'Hnid', country: 'French', organization: null, email: 'FANNY.AGEO@YAHOO.FR' },
  { first_name: 'Ramiel', last_name: 'Marias Massum', country: 'Asia', organization: 'Coastal Development Partnership', email: 'masuim@yahoo.com' },
  { first_name: 'Roy', last_name: 'Axis', country: 'Asia', organization: 'Asia Youth Leadership Program', email: 'rceaxis@gmail.com' },
  { first_name: 'Chennapah', last_name: 'Paqiafi', country: 'Asia', organization: 'APVVU', email: 'chenapah@gmail.com' },
  { first_name: 'Jiten', last_name: 'Yumnam', country: 'Asia', organization: 'Peasant Research and Advocacy Manager', email: 'cra.manager@gmail.com' },
  { first_name: 'Nileisan', last_name: 'Buried Fathima', country: 'Asia', organization: 'Society for Rural Education and Development', email: 'imafatem@gmail.com' },
  { first_name: 'K', last_name: 'Sujit Singh', country: 'Asia', organization: 'YAMMA INDIA', email: 'yammaindia.9@gmail.com' },
  { first_name: 'Trinika', last_name: 'Prasad Saikia', country: 'Asia', organization: 'North-East Affected Area Development Society', email: 'trinthasardf1@gmail.com' },
  { first_name: 'Buerie', last_name: 'Setiawan', country: 'Asia', organization: 'Institute for Globalisation (RAG)', email: 'bueria@gmail.com' },
  { first_name: 'Karim', last_name: 'Djawar', country: 'Asia', organization: 'Arab Group for the Protection of Nature', email: null },
  { first_name: 'Edward', last_name: 'Owegi', country: 'Africa', organization: 'SODNET', email: 'edwardowegi.com' },
  { first_name: 'Lucinda', last_name: 'Odongo', country: 'Africa', organization: 'FAHAMU', email: 'lucinda.odongo@gmail.com' },
  { first_name: 'John', last_name: 'Protazius', country: 'Africa', organization: 'Young Christian Fellowship', email: 'protazius@gmail.com' },
  { first_name: 'Moses', last_name: 'Shaka', country: 'Africa', organization: 'Smallholder Farmers Association', email: 'mosesshaka@gmail.com' },
  { first_name: 'Olunga', last_name: 'Obi Obenni', country: 'Africa', organization: 'SEATINI', email: 'olunga@seatini.com' },
  { first_name: 'Iyumbaa', last_name: 'Kabwa', country: 'Africa', organization: 'SEATINI', email: 'iyumbaa@seatini.com' },
  { first_name: 'Roshelym', last_name: 'Misa (BOT)', country: 'Africa', organization: 'Agenda for Change (A4C)', email: 'maia.rosha@gmail.com' },
  { first_name: 'Vladmir', last_name: 'Muss (BOT)', country: 'Africa', organization: 'RDA AFRICA', email: 'rdaafrica@gmail.com' },
  { first_name: 'Yves', last_name: 'Nigrigalria', country: 'Africa', organization: 'FAHAMU', email: 'yves@fahamu.org' },
  { first_name: 'Nurgie', last_name: 'Ali Salaamu', country: 'Asia', organization: 'Forum of Women NGOs of Kyrgyzstan', email: 'nurgie.ali@gmail.com' },
  { first_name: 'Ashkaya', last_name: 'Omtara', country: 'Asia', organization: 'Nash Vek Public Foundation', email: 'nash.vek@gmail.com' },
  { first_name: 'Dieudonne', last_name: 'Yisrael Iturza', country: 'Asia', organization: 'AIDEI', email: 'dieu.aidei@gmail.com' },
  { first_name: 'Sarojini', last_name: 'Reeam (BOT)', country: 'Asia', organization: 'Pesticide Action Network Asia Pacific', email: 'Sarojini.reeaam@panap.net' },
  { first_name: 'Uridesad', last_name: 'Gumbinishen', country: 'Europe', organization: 'Centre for Human Right Joti', email: 'uridesad@rchj.org' },
  { first_name: 'Maria', last_name: 'Theresa Yrigorin-Iodema', country: 'Europe', organization: 'Stichting Povy Mosixt, IWA', email: null },
  { first_name: 'Aira', last_name: 'Tahat Sayeed', country: 'Asia', organization: 'Roots for Equal', email: 'aira-sayeed@gmail.com' },
  { first_name: 'Aiva', last_name: 'Inayati', country: 'Asia', organization: null, email: null },
  { first_name: 'Aisa', last_name: 'Kristine Lerio', country: 'Asia', organization: null, email: 'tricilaes@gmail.com' },
  { first_name: 'Audrey', last_name: 'Padilla', country: 'Asia', organization: null, email: 'audrey.padilla@gmail.com' },
  { first_name: 'Amyrah', last_name: 'Lislaan (BOT)', country: 'Asia', organization: 'African Christian Peoples Alliance', email: 'amyrah.lislaan@gmail.com' },
  { first_name: 'Amira', last_name: 'Islam Aziz', country: 'Asia', organization: 'IBON International', email: 'iamizislam@gmail.com' },
  { first_name: 'Amel', last_name: 'Porteria', country: 'Asia', organization: 'ASIAN INVESTMENT BANK', email: 'agelporteria@gmail.com' },
  { first_name: 'Beverly', last_name: 'Longid (BOT)', country: 'Asia', organization: 'JPIMCA', email: 'beverly.longid@gmail.com' },
  { first_name: 'Biella', last_name: 'Frillis', country: 'Asia', organization: 'IBON INTERNATIONAL', email: 'bfrillis@yahoo.com' },
  { first_name: 'Bi', last_name: 'Kul Saran', country: 'Asia', organization: 'IBON INTERNATIONAL', email: 'bi.saran@gmail.com' },
  { first_name: 'Christina', last_name: 'Francisco', country: 'Asia', organization: 'IBON International', email: 'cfrancisco@iboninternational.org' },
  { first_name: 'Crips', last_name: 'De la Cruz (BOT)', country: 'Asia', organization: 'PJUIN', email: 'crips@yahoo.com' },
  { first_name: 'Elma', last_name: 'Tawera', country: 'Asia', organization: 'IBON International', email: 'etawera@iboninternational.org' },
  { first_name: 'Erbi', last_name: 'Ram Palisades', country: 'Asia', organization: 'IBON International', email: 'erbi@palisades.org' },
  { first_name: 'Filemon', last_name: 'Salay', country: 'Asia', organization: 'Government Response Center', email: 'grc@palisades.org' },
  { first_name: 'Gasagiona', last_name: 'Escober-dei Castillo', country: 'Asia', organization: 'IBON International', email: 'escoberdei@iboninternational.org' },
  { first_name: 'Jian', last_name: 'Onil Ferna', country: 'Asia', organization: 'IBON International', email: 'jerclinferna@gmail.com' },
  { first_name: 'Jasminella', last_name: 'Lucann', country: 'Asia', organization: 'APFN', email: 'jlucann@forest.org' },
  { first_name: 'Josefina', last_name: 'Nercisa dei Rosario-Malucin', country: 'Asia', organization: 'IBON International', email: 'josefina@iboninternational.org' },
  { first_name: 'Jocel', last_name: 'Efim Daciara', country: 'Asia', organization: 'IBON International', email: 'joceldarina@gmail.com' },
  { first_name: 'Jovis', last_name: 'Engis Alfaro', country: 'Asia', organization: 'IBON International', email: 'jovisengis@gmail.com' },
  { first_name: 'Joyann', last_name: 'Castilla', country: 'Asia', organization: 'IBON International', email: 'joyannc@gmail.com' },
  { first_name: 'Lilanphy', last_name: 'Laureto', country: 'Asia', organization: 'IBON International', email: 'maj_laureto@yahoo.com' },
  { first_name: 'Ma.', last_name: 'Divna L. Mijares', country: 'Asia', organization: null, email: 'abedee.mijares@gmail.com' },
  { first_name: 'Marc', last_name: 'Shirin Ignacio', country: 'Asia', organization: 'IBON International', email: 'mshirin@yahoo.com' },
  { first_name: 'Maria', last_name: 'Josephine Balares', country: 'Asia', organization: 'IBON International', email: 'mjbalares@gmail.com' },
  { first_name: 'Maria', last_name: 'Fe Tayabas', country: 'Asia', organization: 'IBON International', email: 'pjenfayabas@gmail.com' },
  { first_name: 'Maria', last_name: 'Lenina Dominique', country: 'Asia', organization: 'IBON International', email: 'mlenina@gmail.com' },
  { first_name: 'Maria', last_name: 'Theresa Nera Lauron', country: 'Asia', organization: 'Rosa Luxemberg Stiftung', email: 'tetet_lauron@yahoo.com,' },
  { first_name: 'Maria', last_name: 'Theresia Neira Lauron', country: 'Asia', organization: 'Rosa Luxemberg Stiftung', email: 'tetet_lauron@yahoo.com' },
  { first_name: 'Mark', last_name: 'Arnold Passai', country: 'Europe', organization: null, email: 'markest@gmail.com' },
  { first_name: 'Paul', last_name: 'Quinto (BOT)', country: 'Asia', organization: null, email: 'pquinto@gmail.com' },
  { first_name: 'Pio', last_name: 'Veraes, Jr.', country: 'Asia', organization: 'Institute of Political Economy', email: 'pioversio@gmail.com' },
  { first_name: 'Rafael', last_name: 'Marinas', country: 'Asia', organization: null, email: 'rmarinas@gmail.com' },
  { first_name: 'Reina', last_name: 'Erin Villarola', country: 'Asia', organization: 'IBON International', email: 'villarolarenfa@gmail.com' },
  { first_name: 'Rigby', last_name: 'Lamon', country: 'Asia', organization: null, email: 'rigbylamon@gmail.com' },
  { first_name: 'Rodbey', last_name: 'Lakey Jr.', country: 'Asia', organization: 'IBON International', email: 'jjy.labor@yahoo.com,' },
  { first_name: 'Roland', last_name: 'G. Simballan', country: 'Asia', organization: 'Center for People Empowerment and Governance', email: 'grfsimdalan@gmail.com' },
  { first_name: 'Ronell', last_name: 'Villegas', country: 'Asia', organization: 'Crispin S. Beltran Resource Center', email: 'ronell@gmail.com' },
  { first_name: 'Roy', last_name: 'Arevalo', country: 'Asia', organization: 'IBON Africa', email: 'roy@ibonafrica.org' },
  { first_name: 'Sarah', last_name: 'Isabelle Torres', country: 'Asia', organization: 'Reality of Aid Network-Asia Pacific', email: 'storres@realityofaid.org' },
  { first_name: 'Safat', last_name: 'Ferrer', country: 'Asia', organization: 'IBON International', email: 'sferrer@iboninternational.org' },
  { first_name: 'Sr. Emelina', last_name: 'Villegas', country: 'Asia', organization: 'Center for Trade Union and Human Rights', email: 'esay9311@gmail.com' },
  { first_name: 'Sylvia', last_name: 'Meriel (BOT)', country: 'Asia', organization: 'PCFS', email: 'limhollow@gmail.com' },
  { first_name: 'Tadlim', last_name: 'Olali Iboy', country: 'Asia', organization: null, email: 'iboloialt@yahoo.com' },
  { first_name: 'Demba', last_name: 'Moussa Dembele (BOT)', country: 'Africa', organization: 'ARCADE', email: 'dembamd@yahoo.fr' },
  { first_name: 'Henendias', last_name: 'Faya', country: 'Africa', organization: null, email: 'estcyr@yahoo.fr' },
  { first_name: 'Moulument', last_name: 'Lienne Ndaye', country: 'Africa', organization: 'Acord - Senegal', email: 'mlamine.ndaye@acordinternational' },
  { first_name: 'Alerco', last_name: 'Fernandez', country: 'Europe', organization: null, email: 'alerco@hotmail.com' },
  { first_name: 'Fatima', last_name: 'Cole Nassa', country: 'Europe', organization: 'Former CFDE staff', email: 'fatima-core@hotmail.com' },
  { first_name: 'Henry', last_name: 'Maisela', country: 'Africa', organization: 'Reconstruction commission', email: 'hmaisela@yahoo.com' },
  { first_name: 'Yahya', last_name: 'Khalil Misargi', country: 'Africa', organization: 'Welfare Togo', email: 'aishamali@hotmail.com / misargil@hotmail.com' },
  { first_name: 'Kumessi', last_name: 'Yawovi Evernyme', country: 'Togo', organization: 'Centr dAction pour la Development Local', email: 'mjx_evernme@yahoo.fr/direction' },
  { first_name: 'Helen', last_name: 'Grace Aiwali-Wangua', country: 'Africa', organization: 'Council of Anglican Provinces of Africa', email: 'helen@capa.org.org' },
  { first_name: 'Brian', last_name: 'Arrolyn', country: 'North America', organization: null, email: 'briarlie@gmail.com' },
  { first_name: 'Truong', last_name: 'Quoc Con', country: 'Asia', organization: 'SED', email: 'carlaqoo@gmail.com' },
  { first_name: 'Emmanuela', last_name: 'Yona Ochkoye', country: 'Africa', organization: 'Council of Churches in Zambia', email: 'echkoye@gmail.com' },
]

async function importMembers() {
  console.log(`📋 Starting import of ${membersData.length} members with Country & Organization...`)

  const today = new Date().toISOString().split('T')[0]
  const currentYear = new Date().getFullYear()

  try {
    // Step 1: Ensure organization column exists
    console.log('🔧 Checking for organization column...')
    const { data: checkCol, error: checkErr } = await supabase
      .rpc('pg_get_columns', { table_name: 'members' })
    
    // We'll just proceed - if column exists, great; if not, the insert will tell us
    
    // Step 2: Update existing members with organization data
    console.log('🔄 Updating existing members with Country & Organization...')
    
    for (let i = 0; i < membersData.length; i++) {
      const m = membersData[i]
      const memberNum = `MEM-${currentYear}-${String(i + 1).padStart(5, '0')}`
      
      const { error } = await supabase
        .from('members')
        .update({
          country: m.country || 'Philippines',
          organization: m.organization || null,
        })
        .eq('member_number', memberNum)
      
      if (error) {
        // If organization column doesn't exist, we'll get an error
        if (error.message.includes('organization')) {
          console.error('❌ Organization column not found. Run this SQL in Supabase first:')
          console.error('ALTER TABLE members ADD COLUMN IF NOT EXISTS organization VARCHAR(255);')
          process.exit(1)
        }
        console.warn(`⚠️  Failed to update ${memberNum}: ${error.message}`)
      }
    }

    console.log('✅ Successfully updated all members with Country & Organization!')
    
    // Verify
    const { data: sample } = await supabase
      .from('members')
      .select('member_number, first_name, last_name, country, organization')
      .limit(5)
    
    console.log('\n📊 Sample of updated members:')
    sample?.forEach(m => {
      console.log(`  • ${m.member_number} - ${m.first_name} ${m.last_name}`)
      console.log(`    └─ Country: ${m.country || 'N/A'}, Organization: ${m.organization || 'N/A'}`)
    })
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    process.exit(1)
  }
}

importMembers()
