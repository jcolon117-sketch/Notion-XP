import { runEncounterEngine } from './encounterEngine.js'

const result = runEncounterEngine({
  streakDays: 4,
  alreadyTriggeredToday: false,
})

console.log(result)
