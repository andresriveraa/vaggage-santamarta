import React, {View, Text, StyleSheet} from 'react-native';
import {Link} from '@react-navigation/native';
import { CityGuides } from '../../services/PurchasesService';
import colors from '../../constants/colors';

function GuideCard({
  guide,
  pointsLabel,
}: {
  guide: CityGuides;
  pointsLabel: string;
}) {
  return (
    <Link params={{guide}} screen={'MapGuide'}>
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{guide.name || guide.id}</Text>
          <Text style={styles.cardMeta}>
            {guide.points.length} {pointsLabel}
          </Text>
        </View>
      </View>
    </Link>
  );
}
export default GuideCard;


const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{scale: 0.98}],
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.green.textPrimary,
  },
  cardMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
});

