import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

function formatDetails(error: Error | null, componentStack: string | null): string {
  const lines: string[] = [];
  if (error?.name) {
    lines.push(`Name: ${error.name}`);
  }
  if (error?.message) {
    lines.push(`Message: ${error.message}`);
  }
  if (error?.stack) {
    lines.push('', 'Stack:', error.stack);
  }
  if (componentStack?.trim()) {
    lines.push('', 'Component stack:', componentStack.trim());
  }
  return lines.join('\n') || 'No extra details were captured.';
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ componentStack: errorInfo.componentStack ?? null });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, componentStack: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const details = formatDetails(this.state.error, this.state.componentStack);

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <ScrollView
            style={styles.detailsScroll}
            contentContainerStyle={styles.detailsContent}
            nestedScrollEnabled
          >
            <Text selectable style={styles.details}>
              {details}
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: spacing.l,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  detailsScroll: {
    maxHeight: 280,
    marginBottom: spacing.l,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsContent: {
    padding: spacing.m,
  },
  details: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.caption,
  },
  button: {
    alignSelf: 'center',
    backgroundColor: colors.category.work,
    borderRadius: 8,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
  },
  buttonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.surface,
  },
});
