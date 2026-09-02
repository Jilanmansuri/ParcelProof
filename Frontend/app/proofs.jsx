import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { router } from 'expo-router';
import { getProofs } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ProofsScreen() {
  const [allProofs, setAllProofs] = useState([]);
  const [filteredProofs, setFilteredProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Submitted', 'In Progress', 'Resolved', 'Closed'];

  useEffect(() => {
    loadProofs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, activeFilter, allProofs]);

  const loadProofs = async () => {
    setLoading(true);
    setApiError('');

    try {
      const data = await getProofs();
      setAllProofs(data);
    } catch (error) {
      setApiError(error.message || 'Failed to load proofs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = allProofs;

    if (activeFilter !== 'All') {
      result = result.filter(proof => proof.status === activeFilter);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();

      result = result.filter(
        proof =>
          (proof.orderId && proof.orderId.toLowerCase().includes(query)) ||
          (proof.reportId && proof.reportId.toLowerCase().includes(query))
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
        <Text style={styles.cardTitle}>{item.orderId}</Text>
        <StatusBadge status={item.status} />
      </View>

      <Text style={styles.cardText}>Report ID: {item.reportId}</Text>
      <Text style={styles.cardText}>Condition: {item.condition}</Text>
      <Text style={styles.cardText}>Courier: {item.courier || 'N/A'}</Text>
      <Text style={styles.cardDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (apiError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{apiError}</Text>

        <Pressable style={styles.retryButton} onPress={loadProofs}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Order ID or Report ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => setActiveFilter(item)}
            >
              <Text
                style={[styles.filterText, activeFilter === item && styles.filterTextActive]}
              >
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {filteredProofs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {allProofs.length === 0
              ? "You haven't added any proofs yet."
              : 'No matching proofs found.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProofs}
          keyExtractor={item => item._id || item.reportId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#4A90E2',
  },
  filterText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 15,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});