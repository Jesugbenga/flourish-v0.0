import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { api } from '@/lib/api';
import { useEffect } from 'react';

export default function TodoScreen() {
  const router = useRouter();
  const navigation: any = useNavigation();
  const [todos, setTodos] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const items = await api.getTodos();
        if (!mounted) return;
        // normalize fields
        setTodos(items.map((i: any) => ({ id: i.id, text: i.text ?? '', completed: !!i.completed })));
      } catch (err) {
        // ignore for now
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Set native header title and rely on it for back button/title
  useLayoutEffect(() => {
    navigation.setOptions({ title: 'To‑Do List' });
  }, [navigation]);

  const addTodo = () => {
    const text = newTodo.trim();
    if (!text) return;
    (async () => {
      try {
        const created = await api.addTodo(text);
        setTodos((s) => [{ id: created.id, text: created.text ?? text, completed: !!created.completed }, ...s]);
        setNewTodo('');
      } catch (err) {
        // fallback to local add
        setTodos((s) => [{ id: Date.now().toString(), text, completed: false }, ...s]);
        setNewTodo('');
      }
    })();
  };

  const toggleTodo = (id: string) => {
    const current = todos.find((t) => t.id === id);
    if (!current) return;
    const newVal = !current.completed;
    // optimistic update
    setTodos((s) => s.map((t) => (t.id === id ? { ...t, completed: newVal } : t)));
    api.updateTodo(id, { completed: newVal }).catch(() => {
      // revert on failure
      setTodos((s) => s.map((t) => (t.id === id ? { ...t, completed: current.completed } : t)));
    });
  };

  const removeTodo = (id: string) => {
    // optimistic remove
    const prev = todos;
    setTodos((s) => s.filter((t) => t.id !== id));
    api.deleteTodo(id).catch(() => setTodos(prev));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>Tasks to help you follow your plan.</Text>

        <View style={{ marginTop: Spacing.lg }}>
          <View style={styles.todoInputRow}>
            <TextInput
              value={newTodo}
              onChangeText={setNewTodo}
              placeholder="Add a new task"
              style={styles.todoInput}
              returnKeyType="done"
              onSubmitEditing={addTodo}
            />
            <TouchableOpacity style={styles.addButton} onPress={addTodo} accessibilityLabel="Add task">
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {todos.length === 0 ? (
            <Text style={[styles.cardSubtitle, { marginTop: Spacing.sm }]}>No tasks yet — add one above.</Text>
          ) : (
            todos.map((t) => (
              <View key={t.id} style={styles.todoItem}>
                <TouchableOpacity onPress={() => toggleTodo(t.id)} style={styles.todoLeft}>
                  <Ionicons
                    name={t.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={t.completed ? Colors.sage : Colors.textMuted}
                  />
                  <Text style={[styles.todoText, t.completed && styles.todoTextDone]}>{t.text}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeTodo(t.id)}>
                  <Ionicons name="trash" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  title: { ...Typography.largeTitle, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textSecondary },
  cardSubtitle: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },
  todoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  todoInput: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    color: Colors.text,
  },
  addButton: {
    marginLeft: Spacing.sm,
    backgroundColor: Colors.sage,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  todoLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  todoText: { marginLeft: Spacing.md, color: Colors.text },
  todoTextDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
});
