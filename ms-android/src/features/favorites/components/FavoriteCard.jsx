import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '../../../shared/components/common/Common';
import { getFavoriteAccountTypeLabel } from '../utils/favoriteHelpers';
import { COLORS } from '../../../shared/constants/theme';
import styles from '../screens/FavoritesScreen.styles';

const FavoriteCard = ({ item, onTransfer, onEdit, onDelete }) => (
    <Card style={styles.card}>
        <View style={styles.cardHeader}>
            <View>
                <Text style={styles.alias}>{item.alias}</Text>
                <Text style={styles.accountNumber}>{item.accountNumber}</Text>
            </View>
            <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{getFavoriteAccountTypeLabel(item.accountType)}</Text>
            </View>
        </View>

        <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onTransfer(item)} activeOpacity={0.7}>
                <Feather name="send" size={16} color={COLORS.primary} />
                <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Transferir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)} activeOpacity={0.7}>
                <Feather name="edit-2" size={16} color={COLORS.textLight} />
                <Text style={[styles.actionBtnText, { color: COLORS.textLight }]}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(item)} activeOpacity={0.7}>
                <Feather name="trash-2" size={16} color={COLORS.error} />
                <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Eliminar</Text>
            </TouchableOpacity>
        </View>
    </Card>
);

export default FavoriteCard;
