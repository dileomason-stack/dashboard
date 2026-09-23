// Answers for the daily word game: common words only, so the puzzle is fair.
// (Guesses are checked against a bigger dictionary in public/words5.txt.)
export const ANSWERS = `
about above actor adapt admit adopt adult after again agent agree ahead alarm album alert alike alive allow alone along alter amber angel anger angle angry apple apply arena argue arise armor aside award aware bacon badge baker basic beach beard beast begin being below bench berry birth black blade blame blank blast blend bless blind block blood bloom board boast bonus boost booth brain brake brand brave bread break brick bride brief bring broad brown brush build bunch burst buyer cabin cable camel candy canoe cargo carry catch cause chain chair chalk charm chart chase cheap check cheek cheer chess chest chief child chill choir chunk civic claim class clean clear clerk click cliff climb clock close cloth cloud coach coast color comet coral couch count court cover crack craft crane crash crazy cream crime crisp crowd crown crush curve cycle daily dance death delay depth diary dizzy dough draft drain drama dream dress drift drink drive eager eagle early earth eight elbow elder empty enjoy enter entry equal error essay event every exact exist extra fable faint faith false fancy feast fence ferry fever field fifth fight final flame flash fleet flock flood floor flour fluid focus force forge forth forum found frame fresh front frost fruit funny ghost giant given glass globe glory glove grace grade grain grand grant grape grass great green greet grill gross group guard guess guest guide habit happy harsh heart heavy hedge hello hobby honey honor horse hotel house human humor hurry ideal image index inner input issue ivory jelly jewel joint judge juice jumbo kayak knife knock label labor large laser later laugh layer learn lemon level light limit linen lives local logic loose lucky lunch magic major maker mango maple march match mayor medal media melon mercy metal meter model money month moral motor mount mouse mouth movie music nerve never night noble noise north novel nurse ocean offer often olive onion opera orbit order other outer owner paint panel panic paper party pasta patch peace peach pearl pedal penny phase phone photo piano piece pilot pitch pizza place plain plane plant plate plaza point polar porch power press price pride prime print prize proof proud prove pulse punch pupil puppy queen quest quick quiet quilt quote radar radio raise ranch range rapid reach react ready realm rebel relax reply rider ridge rifle right rigid river roast robot rocky round route royal rugby ruler salad sauce scale scarf scene scoop score scout shade shake shape share shark sharp sheep shelf shell shift shine shirt shock shore short shout sight skill skirt slate sleep slice slide smart smile smoke snack snake solar solid solve sound south space spare spark speak speed spell spend spice spine spoon sport spray squad stack staff stage stair stamp stand start state steam steel stick still stone storm story stove straw strip study style sugar sunny super swamp sweet swing sword table taste teach thank theme thick thing think third three throw thumb tiger title toast token topic torch total touch tower track trade trail train treat trend trial tribe trick truck trust truth tulip twist uncle under union unity upper upset urban usage usual valid value vapor video vigor visit vital vivid vocal voice wagon waste watch water whale wheat wheel white whole world worry worth wound write yacht yield young youth zebra
`
  .trim()
  .split(/\s+/)

// Same word for everyone on the same day (by local date).
export function dailyAnswer(date = new Date()) {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)
  return ANSWERS[(dayNumber * 7919) % ANSWERS.length]
}

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Wordle-style scoring that handles repeated letters: exact matches first,
// then "present" only as many times as the letter remains in the answer.
export function scoreGuess(guess, answer) {
  const result = Array(5).fill('absent')
  const remaining = {}
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) result[i] = 'correct'
    else remaining[answer[i]] = (remaining[answer[i]] ?? 0) + 1
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue
    if (remaining[guess[i]] > 0) {
      result[i] = 'present'
      remaining[guess[i]] -= 1
    }
  }
  return result
}
