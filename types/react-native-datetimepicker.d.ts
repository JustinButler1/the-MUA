declare module '@react-native-community/datetimepicker' {
  import { ViewProps } from 'react-native';

  type Display = 'default' | 'spinner' | 'calendar' | 'clock' | 'compact' | 'inline';
  type Mode = 'date' | 'time' | 'datetime';

  export interface DateTimePickerEvent {
    type: 'set' | 'dismissed' | string;
    nativeEvent: any;
  }

  export interface DateTimePickerProps extends ViewProps {
    value: Date;
    mode?: Mode;
    display?: Display;
    onChange?: (event: DateTimePickerEvent, date?: Date) => void;
    minimumDate?: Date;
    maximumDate?: Date;
    minuteInterval?: number;
    is24Hour?: boolean;
    timeZoneOffsetInMinutes?: number;
    testID?: string;
  }

  const DateTimePicker: (props: DateTimePickerProps) => JSX.Element;
  export default DateTimePicker;
}


