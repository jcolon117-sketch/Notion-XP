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

  // 👇 ADD THIS BLOCK RIGHT HERE
  response.results.forEach((page, i) => {
    const title =
      page.properties?.Name?.title?.[0]?.plain_text ?? '(no title)'
    console.log(`${i + 1}. ${title}`)
  })
  // 👆 END ADDITION
}

resetDailyQuests().catch(console.error)
