import 'dotenv/config'
import { Client } from '@notionhq/client'

console.log('DEBUG DAILY_QUESTS_DB =', process.env.DAILY_QUESTS_DB)
console.log('DEBUG NOTION_TOKEN =', process.env.NOTION_TOKEN?.slice(0, 10))

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

async function resetDailyQuests() {
  console.log('🔄 Resetting daily quests...')

  const response = await notion.databases.query({
    database_id: process.env.DAILY_QUESTS_DB,
  })

  console.log(`✅ Found ${response.results.length} quests`)
}

resetDailyQuests().catch((err) => {
  console.error('❌ Daily reset failed:', err)
})
