import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProofs } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

export default function ProofsScreen() {
  const [allProofs, setAllProofs] = useState([]);
  const [filteredProofs, setFilteredProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Submitted', 'In Progress', 'Resolved', 'Closed'];

  const loadProofs = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setApiError('');

    try {
      const data = await getProofs();
      const list = Array.isArray(data) ? data : [];
      setAllProofs(list);
    } catch (error) {
      setApiError(error.message || 'Failed to load proofs. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProofs();
    }, [])
  );

  React.useEffect(() => {
    applyFilters();
  }, [searchQuery, activeFilter, allProofs]);

  const applyFilters = () => {
    let result = allProofs;

    if (activeFilter !== 'All') {
      result = result.filter(proof => proof.status === activeFilter);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();

      result = result.filter(
        proof =>
          (proof.orderId && proof.orderId.toLowerCase().includes(query)) ||
          (proof.reportId && proof.reportId.toLowerCase().includes(query)) ||
          (proof.courier && proof.courier.toLowerCase().includes(query))
      );
    }

    setFilteredProofs(result);
  };

  const renderItem = ({ item }) => (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/proof-details',
          params: { reportId: item.reportId },
        })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="cube" size={18} color="#4A90E2" style={{ marginRight: 6 }} />
          <Text style={styles.cardTitle}>{item.orderId}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Report ID:</Text>
          <Text style={styles.detailValue}>{item.reportId}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Condition:</Text>
          <Text style={styles.detailValue}>{item.condition}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Courier:</Text>
          <Text style={styles.detailValue}>{item.courier || 'N/A'}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>
            📅 {new Date(item.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.viewLink}>View Details →</Text>
        </View>
      </View>
    </Pressable>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading Proofs...</Text>
      </View>
    );
  }

  if (apiError && allProofs.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={54} color="#E74C3C" />
        <Text style={styles.errorText}>{apiError}</Text>
        <Pressable style={styles.retryButton} onPress={() => loadProofs()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Order ID, Report ID, Courier..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </Pressable>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={item => item}
          contentContainerStyle={styles.filtersContainer}
          renderItem={({ item }) => {
            const count =
              item === 'All'
                ? allProofs.length
                : allProofs.filter(p => p.status === item).length;
            const isSelected = activeFilter === item;

            return (
              <Pressable
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setActiveFilter(item)}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {item}
                </Text>
                <View style={[styles.filterBadge, isSelected && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, isSelected && styles.filterBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Proofs List or Empty State */}
      {filteredProofs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={50} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>
            {allProofs.length === 0 ? 'No Proofs Created Yet' : 'No Matching Proofs'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {allProofs.length === 0
              ? 'Snap and submit your first parcel proof anytime!'
              : 'Try changing your search terms or status filter.'}
          </Text>
          {allProofs.length === 0 && (
            <Pressable
              style={styles.createButton}
              onPress={() => router.push('/create-proof')}
            >
              <Text style={styles.createButtonText}>+ Create New Proof</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredProofs}
          keyExtractor={item => item._id || item.reportId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadProofs(true)}
              colors={['#4A90E2']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 14,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E9F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A2530',
    padding: 0,
  },
  filtersWrapper: {
    marginBottom: 8,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 6,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
    paddingBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2530',
  },
  cardBody: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2C3E50',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  cardDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  viewLink: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 18,
  },
  createButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
