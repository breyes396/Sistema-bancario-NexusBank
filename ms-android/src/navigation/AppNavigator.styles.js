import { StyleSheet } from 'react-native';
import { BANK_DARK as BANK } from '../shared/constants/colors';

export default StyleSheet.create({
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BANK.background,
    },
});
