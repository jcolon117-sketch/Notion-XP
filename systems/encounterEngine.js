import 'dotenv/config'
import { Client } from '@notionhq/client'
import { generateEncountersIfMissing } from './encounterGenerator.js'

const notion = new Client({
  auth: process.env.NOTION_API_KEY
})

/**
 * Run a real-life encounter for a character
 * Usage:
 * node systems/encounterEngine.js <CHARACTER_PAGE_ID>
 */
async function runEncounter(characterPageId) {
  if (!characterPageId) {
    console.error('❌ Character page ID required')
    process.exit(1)
  }

  console.log('🎲 Rolling encounter...')

  /* ──────────────────────────────────────────────── */
  /* LOAD CHARACTER                                   */
  /* ──────────────────────────────────────────────── */

  const character = await notion.pages.retrieve({
    page_id: characterPageId
  })

  const level =
    character.properties['Current Level']?.number ?? 1

  const currentXP =
    character.properties['Current XP']?.number ?? 0

  const currentEnergy =
    character.properties['Current Energy']?.number ?? 0

  console.log(`🧍 Character level: ${level}`)

  /* ──────────────────────────────────────────────── */
  /* LOAD ENCOUNTERS                                  */
  /* ──────────────────────────────────────────────── */

  let encounters = await notion.databases.query({
    database_id: process.env.NOTION_ENCOUNTERS_DB_ID
  })

  console.log(`📦 Total encounters: ${encounters.results.length}`)

  /* ──────────────────────────────────────────────── */
  /* FILTER VALID ENCOUNTERS                          */
  /* ──────────────────────────────────────────────── */

  let validEncounters = encounters.results.filter(e => {
    const active = e.properties.Active?.checkbox === true
    const min = e.properties['Min Level']?.number ?? 1
    const max = e.properties['Max Level']?.number ?? 999
    return active && level >= min && level <= max
  })

  /* ──────────────────────────────────────────────── */
  /* AUTO-GENERATE IF NONE EXIST                      */
  /* ──────────────────────────────────────────────── */

  if (validEncounters.length === 0) {
    console.log('⚠️ No valid encounters — generating real-life encounters...')
    await generateEncountersIfMissing()

    encounters = await notion.databases.query({
      database_id: process.env.NOTION_ENCOUNTERS_DB_ID
    })

    validEncounters = encounters.results.filter(e => {
      const active = e.properties.Active?.checkbox === true
      const min = e.properties['Min Level']?.number ?? 1
      const max = e.properties['Max Level']?.number ?? 999
      return active && level >= min && level <= max
    })
  }

  if (validEncounters.length === 0) {
    console.log('❌ Still no encounters available after generation')
    return
  }

  /* ──────────────────────────────────────────────── */
  /* WEIGHTED RNG ROLL                                */
  /* ──────────────────────────────────────────────── */

  const weightedPool = []

  for (const e of validEncounters) {
    const weight = e.properties.Weight?.number ?? 1
    for (let i = 0; i < weight; i++) {
      weightedPool.push(e)
    }
  }

  const encounter =
    weightedPool[Math.floor(Math.random() * weightedPool.length)]

  const name =
    encounter.properties.Name?.title?.[0]?.text?.content ??
    'Unknown encounter'

  const xpReward =
    encounter.properties['XP Reward']?.number ?? 0

  const energyCost =
    encounter.properties['Energy Cost']?.number ?? 0

  console.log(`🎯 Encounter triggered: ${name}`)
  console.log(`✨ XP gained: ${xpReward}`)

  /* ──────────────────────────────────────────────── */
  /* APPLY ENERGY COST (SAFE)                         */
  /* ──────────────────────────────────────────────── */

  if (energyCost > 0 && currentEnergy > 0) {
    await notion.pages.update({
      page_id: characterPageId,
      properties: {
        'Current Energy': {
          number: Math.max(0, currentEnergy - energyCost)
        }
      }
    })
  }

  /* ──────────────────────────────────────────────── */
  /* APPLY XP (CORRECT CHARACTER PROPERTY)            */
  /* ──────────────────────────────────────────────── */

  if (xpReward > 0) {
    await notion.pages.update({
      page_id: characterPageId,
      properties: {
        'Current XP': {
          number: currentXP + xpReward
        }
      }
    })
  }
}

/* ──────────────────────────────────────────────── */
/* CLI ENTRY                                         */
/* ──────────────────────────────────────────────── */

const characterId = process.argv[2]

runEncounter(characterId).catch(err => {
  console.error('❌ Encounter failed')
  console.error(err)
})
