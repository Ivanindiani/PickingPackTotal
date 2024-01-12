import {NativeModules} from 'react-native';
const {ScannerReceiver} = NativeModules;
interface ScannerInterface {
  //createCalendarEvent(name: string, location: string): void;
  //getReferrerData(): void;
  ScannerReceiver(): void
}
export default ScannerReceiver as ScannerInterface;
