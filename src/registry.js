import Molarity from './components/Molarity'
import Dilution from './components/Dilution'
import SerialDilution from './components/SerialDilution'
import Reagents from './components/Reagents'
import BufferRecipes from './components/BufferRecipes'
import PrimerResuspension from './components/PrimerResuspension'
import NucleicMoles from './components/NucleicMoles'
import A260 from './components/A260'
import Ligation from './components/Ligation'
import MasterMix from './components/MasterMix'
import QpcrPlate from './components/QpcrPlate'
import AgaroseGel from './components/AgaroseGel'
import SdsPage from './components/SdsPage'
import CellSeeding from './components/CellSeeding'
import UnitConverter from './components/UnitConverter'

export const PANELS = {
  molarity: Molarity,
  dilution: Dilution,
  serial: SerialDilution,
  reagents: Reagents,
  buffers: BufferRecipes,
  primers: PrimerResuspension,
  nucleic: NucleicMoles,
  a260: A260,
  ligation: Ligation,
  mastermix: MasterMix,
  qpcr: QpcrPlate,
  agarose: AgaroseGel,
  sdspage: SdsPage,
  seeding: CellSeeding,
  units: UnitConverter,
}
