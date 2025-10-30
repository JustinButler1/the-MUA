import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { type PostType } from '@/lib/types/posts';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

/**
 * CreatePostScreen renders a form for composing and creating new posts.
 * It supports multiple post types and lets the author be a profile or a group.
 * For event/newsletter posts, users can pick an image from the device instead of typing a URL.
 *
 * @returns The create post screen UI with form fields and actions.
 */
export default function CreatePostScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();

  const [postType, setPostType] = useState<PostType>('text-only');
  const [content, setContent] = useState('');
  const [headline, setHeadline] = useState('');
  const [subtext, setSubtext] = useState('');
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostTypeDropdown, setShowPostTypeDropdown] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number>(1.91);

  // Event-specific optional fields
  const [eventLocation, setEventLocation] = useState<string>('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [eventStartTime, setEventStartTime] = useState<Date | null>(null);
  const [eventEndTime, setEventEndTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tempStartTime, setTempStartTime] = useState<Date>(new Date());
  const [tempEndTime, setTempEndTime] = useState<Date>(new Date());
  
  // Post Author state
  const [profileName, setProfileName] = useState<string>('');
  const [groupsWithPermissions, setGroupsWithPermissions] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<{ type: 'profile' | 'group'; id: string; name: string } | null>(null);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(true);

  /**
   * Post type options for the dropdown
   */
  const postTypeOptions: { value: PostType; label: string }[] = [
    { value: 'text-only', label: 'Text Only' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'event', label: 'Event' },
    { value: 'newsletter', label: 'Newsletter' },
  ];

  /**
   * Determines if a given post type is allowed for the currently selected author.
   * Profiles may only create text-only posts. Groups may create any post type.
   *
   * @param type - The candidate post type to evaluate.
   * @param author - The selected post author (profile or group).
   * @returns True if the post type can be selected for the given author.
   */
  const isPostTypeAllowedForAuthor = (
    type: PostType,
    author: { type: 'profile' | 'group'; id: string; name: string } | null
  ): boolean => {
    if (!author) return false;
    if (author.type === 'group') return true;
    return type === 'text-only';
  };

  /**
   * Available aspect ratios for image preview (letterboxed) selection.
   * 1.91:1 is typical for link previews, 4:5 is portrait-friendly, and 1:1 is square.
   */
  const aspectRatioOptions: { label: string; value: number }[] = [
    { label: '1.91:1', value: 1.91 },
    { label: '4:5', value: 4 / 5 },
    { label: '1:1', value: 1 },
  ];

  /**
   * Gets the display label for the selected post type
   */
  const getPostTypeLabel = (type: PostType): string => {
    return postTypeOptions.find(opt => opt.value === type)?.label || 'Text Only';
  };

  /**
   * Fetches user profile and groups where user has post permissions
   * Post permissions are granted to 'owner' and 'admin' roles
   */
  useEffect(() => {
    if (!user?.id) return;

    const fetchAuthorOptions = async () => {
      setIsLoadingAuthors(true);
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profileData) {
          setProfileName(profileData.display_name || '');
          // Set default author to profile
          setSelectedAuthor({ type: 'profile', id: user.id, name: profileData.display_name || '' });
        }

        // Fetch groups where user has post permissions (owner or admin role)
        const { data: groupsData, error: groupsError } = await supabase
          .from('grp_member')
          .select(`
            grp_id,
            role,
            grp!inner(id, name)
          `)
          .eq('user_id', user.id)
          .in('role', ['owner', 'admin']);

        if (groupsError) {
          console.error('Error fetching groups:', groupsError);
        } else if (groupsData) {
          const groups = groupsData.map((item: any) => ({
            id: item.grp.id,
            name: item.grp.name,
          }));
          setGroupsWithPermissions(groups);
          console.log('Groups with post permissions:', groups);
        }
      } catch (error) {
        console.error('Error fetching author options:', error);
      } finally {
        setIsLoadingAuthors(false);
      }
    };

    fetchAuthorOptions();
  }, [user?.id]);

  /**
   * Gets all available author options
   */
  const getAuthorOptions = () => {
    const options: Array<{ type: 'profile' | 'group'; id: string; name: string }> = [];
    
    // Add profile as first option
    if (profileName) {
      options.push({ type: 'profile', id: user?.id || '', name: profileName });
    }
    
    // Add groups with permissions
    groupsWithPermissions.forEach(group => {
      options.push({ type: 'group', id: group.id, name: group.name });
    });
    
    return options;
  };

  /**
   * Gets the display label for the selected author
   */
  const getAuthorLabel = (): string => {
    if (!selectedAuthor) return profileName || 'Loading...';
    return selectedAuthor.name;
  };

  /**
   * Handles author selection change
   */
  const handleAuthorChange = (author: { type: 'profile' | 'group'; id: string; name: string }) => {
    console.log('Post author changed to:', author.type, author.name);
    setSelectedAuthor(author);
    // Ensure post type remains valid when switching authors
    if (author.type === 'profile' && postType !== 'text-only') {
      setPostType('text-only');
    }
    setShowAuthorDropdown(false);
  };

  /**
   * Handles form submission
   * Currently just logs the form data
   */
  const handleSubmit = async () => {
    console.log('=== Create Post Form Submission ===');
    console.log('Post Type:', postType, `(${getPostTypeLabel(postType)})`);
    console.log('Content:', content);

    // Guard: Profiles can only submit text-only posts
    if (!isPostTypeAllowedForAuthor(postType, selectedAuthor)) {
      console.warn('Selected post type is not allowed for this author.');
      return;
    }
    
    if (postType === 'announcement' || postType === 'event' || postType === 'newsletter') {
      console.log('Headline:', headline);
      if (postType === 'newsletter') {
        console.log('Subtext:', subtext);
      }
    }
    
    if ((postType === 'event' || postType === 'newsletter') && pickedImageUri) {
      console.log('Picked Image URI:', pickedImageUri);
    }

    if (postType === 'event') {
      console.log('Event Location:', eventLocation || '(none)');
      console.log('Event Date:', eventDate ? eventDate.toISOString() : '(none)');
      console.log('Start Time:', eventStartTime ? eventStartTime.toISOString() : '(none)');
      console.log('End Time:', eventEndTime ? eventEndTime.toISOString() : '(none)');
    }
    
    console.log('Post Author:', selectedAuthor ? `${selectedAuthor.type}: ${selectedAuthor.name} (${selectedAuthor.id})` : 'Not selected');
    console.log('User ID:', user?.id);
    console.log('Timestamp:', new Date().toISOString());
    console.log('===================================');

    setIsSubmitting(true);
    
    // Simulate async operation
    setTimeout(() => {
      setIsSubmitting(false);
      console.log('Form submission complete (placeholder)');
      // TODO: Navigate back after actual save
      // router.back();
    }, 1000);
  };

  /**
   * Opens the device image library and lets the user pick an image.
   * Stores the selected image URI for preview and later upload.
   */
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Media library permission not granted');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Avoid any in-picker cropping/zooming
        quality: 0.9,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPickedImageUri(result.assets[0].uri);
        console.log('Image picked:', result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
    }
  };

  /**
   * Opens the platform date picker for picking the event date.
   */
  const openDatePicker = () => {
    setTempDate(eventDate ?? new Date());
    setShowDatePicker(true);
  };

  /**
   * Opens the platform time picker for the start time.
   */
  const openStartTimePicker = () => {
    setTempStartTime(eventStartTime ?? new Date());
    setShowStartTimePicker(true);
  };

  /**
   * Opens the platform time picker for the end time.
   */
  const openEndTimePicker = () => {
    setTempEndTime(eventEndTime ?? new Date());
    setShowEndTimePicker(true);
  };

  /**
   * Handles cancel button press
   */
  const handleCancel = () => {
    console.log('Create post form cancelled');
    router.back();
  };

  /**
   * Handles post type selection change
   */
  const handlePostTypeChange = (type: PostType) => {
    console.log('Post type changed to:', type, `(${getPostTypeLabel(type)})`);
    setPostType(type);
    setShowPostTypeDropdown(false);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            Create Post
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.text, opacity: 0.7 }]}>
            Share with your groups
          </ThemedText>
        </View>

        {/* Post Type and Author Selection */}
        <View style={styles.row}>
          

          <View style={[styles.section, styles.halfWidth]}>
            <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>
              Post Author
            </ThemedText>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.background + 'CC', borderColor: colors.text + '30' }]}
              onPress={() => {
                console.log('Post author dropdown opened');
                setShowAuthorDropdown(true);
              }}
              disabled={isLoadingAuthors}
            >
              <ThemedText style={[styles.dropdownButtonText, { color: colors.text, opacity: isLoadingAuthors ? 0.5 : 1 }]}>
                {isLoadingAuthors ? 'Loading...' : getAuthorLabel()}
              </ThemedText>
              <ThemedText style={[styles.dropdownArrow, { color: colors.text, opacity: isLoadingAuthors ? 0.5 : 1 }]}>
                ▼
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>
              Post Type
            </ThemedText>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.background + 'CC', borderColor: colors.text + '30' }]}
              onPress={() => {
                console.log('Post type dropdown opened');
                setShowPostTypeDropdown(true);
              }}
            >
              <ThemedText style={[styles.dropdownButtonText, { color: colors.text }]}>
                {getPostTypeLabel(postType)}
              </ThemedText>
              <ThemedText style={[styles.dropdownArrow, { color: colors.text }]}>
                ▼
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Fields */}
        <View style={styles.section}>
          {postType === 'announcement' || postType === 'event' || postType === 'newsletter' ? (
            <>
              <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>Headline (optional)</ThemedText>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background + 'CC', color: colors.text }]}
                value={headline}
                onChangeText={(text) => {
                  console.log('Headline changed:', text);
                  setHeadline(text);
                }}
                placeholder="Enter headline"
                placeholderTextColor={colors.text + '80'}
                multiline
              />

              {postType === 'newsletter' && (
                <>
                  <ThemedText style={[styles.sectionLabel, { color: colors.text, marginTop: 16 }]}>Subtext</ThemedText>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.background + 'CC', color: colors.text }]}
                    value={subtext}
                    onChangeText={(text) => {
                      console.log('Subtext changed:', text);
                      setSubtext(text);
                    }}
                    placeholder="Enter subtext"
                    placeholderTextColor={colors.text + '80'}
                    multiline
                  />
                </>
              )}

              <ThemedText style={[styles.sectionLabel, { color: colors.text, marginTop: 16 }]}>
                {postType === 'newsletter' ? 'Content (optional preview)' : 'Content'}
              </ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea, { backgroundColor: colors.background + 'CC', color: colors.text }]}
                value={content}
                onChangeText={(text) => {
                  console.log('Content changed:', text);
                  setContent(text);
                }}
                placeholder={postType === 'newsletter' ? 'Optional preview content' : "What's going on?"}
                placeholderTextColor={colors.text + '80'}
                multiline
                numberOfLines={6}
              />
            </>
          ) : (
            <>
              <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>Content</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea, { backgroundColor: colors.background + 'CC', color: colors.text }]}
                value={content}
                onChangeText={(text) => {
                  console.log('Content changed:', text);
                  setContent(text);
                }}
                placeholder="What's going on?"
                placeholderTextColor={colors.text + '80'}
                multiline
                numberOfLines={6}
              />
            </>
          )}
        </View>

        {/* Image Picker (for event or optional newsletter) */}
        {(postType === 'event' || postType === 'newsletter') && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionLabel, { color: colors.text }]}> 
              Image {postType === 'newsletter' && '(optional)'}
            </ThemedText>
            {/* Aspect ratio selector */}
            <View style={styles.aspectRow}>
              {aspectRatioOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.aspectButton,
                    { backgroundColor: colors.background + 'CC', borderColor: colors.text + '30' },
                    selectedAspectRatio === opt.value && { borderColor: colors.tint, backgroundColor: colors.tint + '20' },
                  ]}
                  onPress={() => setSelectedAspectRatio(opt.value)}
                >
                  <ThemedText
                    style={[
                      styles.aspectButtonText,
                      { color: selectedAspectRatio === opt.value ? colors.tint : colors.text },
                    ]}
                  >
                    {opt.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {pickedImageUri ? (
              <View style={styles.imagePreviewContainer}>
                <View style={[styles.imagePreviewFrame, { aspectRatio: selectedAspectRatio }]}>
                  <Image
                    source={{ uri: pickedImageUri }}
                    style={styles.imagePreviewImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.imageActions}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: colors.background + 'CC', borderColor: colors.text + '30' }]}
                    onPress={handlePickImage}
                  >
                    <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>Change Image</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: colors.background + 'CC', borderColor: colors.text + '30' }]}
                    onPress={() => setPickedImageUri(null)}
                  >
                    <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>Remove</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.pickImageButton, { backgroundColor: colors.background + 'CC', borderColor: colors.text + '30' }]}
                onPress={handlePickImage}
              >
                <ThemedText style={[styles.pickImageButtonText, { color: colors.text }]}>Pick an image</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Event Optional Fields */}
        {postType === 'event' && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>Event Details (optional)</ThemedText>
            {/* Location */}
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background + 'CC', color: colors.text }]}
              value={eventLocation}
              onChangeText={(text) => setEventLocation(text)}
              placeholder="Location"
              placeholderTextColor={colors.text + '80'}
            />

            {/* Date / Time Row */}
            <View style={[styles.row, { marginTop: 12 }]}> 
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.background + 'CC', borderColor: colors.text + '30' }]}
                onPress={openDatePicker}
              >
                <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>
                  {eventDate ? new Date(eventDate).toLocaleDateString() : 'Pick Date'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.background + 'CC', borderColor: colors.text + '30' }]}
                onPress={openStartTimePicker}
              >
                <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>
                  {eventStartTime ? new Date(eventStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Start Time'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.background + 'CC', borderColor: colors.text + '30' }]}
                onPress={openEndTimePicker}
              >
                <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>
                  {eventEndTime ? new Date(eventEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'End Time'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.background + 'CC' }]}
            onPress={handleCancel}
          >
            <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.submitButton,
              { backgroundColor: colors.tint },
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <ThemedText style={[styles.submitButtonText, { color: colors.background }]}>
                Create Post
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Post Type Dropdown Modal */}
      <Modal
        visible={showPostTypeDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPostTypeDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            console.log('Post type dropdown closed');
            setShowPostTypeDropdown(false);
          }}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                Select Post Type
              </ThemedText>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  console.log('Post type dropdown closed');
                  setShowPostTypeDropdown(false);
                }}
              >
                <ThemedText style={[styles.modalCloseButtonText, { color: colors.text }]}>
                  ✕
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dropdownList}>
              {postTypeOptions.map((option) => {
                const allowed = isPostTypeAllowedForAuthor(option.value, selectedAuthor);
                const isSelected = postType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      isSelected && { backgroundColor: colors.tint + '20' },
                      !allowed && { opacity: 0.5 },
                    ]}
                    disabled={!allowed}
                    onPress={() => allowed && handlePostTypeChange(option.value)}
                  >
                    <ThemedText style={[
                      styles.dropdownOptionText,
                      { color: isSelected ? colors.tint : colors.text }
                    ]}>
                      {option.label}
                      {!allowed ? ' (Groups Only)' : ''}
                    </ThemedText>
                    {isSelected && (
                      <ThemedText style={[styles.dropdownOptionCheck, { color: colors.tint }]}>
                        ✓
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Post Author Dropdown Modal */}
      <Modal
        visible={showAuthorDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAuthorDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            console.log('Post author dropdown closed');
            setShowAuthorDropdown(false);
          }}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                Select Post Author
              </ThemedText>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  console.log('Post author dropdown closed');
                  setShowAuthorDropdown(false);
                }}
              >
                <ThemedText style={[styles.modalCloseButtonText, { color: colors.text }]}>
                  ✕
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dropdownList}>
              {getAuthorOptions().map((option, index) => (
                <TouchableOpacity
                  key={`${option.type}-${option.id}`}
                  style={[
                    styles.dropdownOption,
                    selectedAuthor?.type === option.type && selectedAuthor?.id === option.id && { backgroundColor: colors.tint + '20' }
                  ]}
                  onPress={() => handleAuthorChange(option)}
                >
                  <View style={styles.authorOptionContent}>
                    <ThemedText style={[
                      styles.dropdownOptionText,
                      { color: selectedAuthor?.type === option.type && selectedAuthor?.id === option.id ? colors.tint : colors.text }
                    ]}>
                      {option.name}
                    </ThemedText>
                    <ThemedText style={[
                      styles.authorOptionType,
                      { color: colors.text, opacity: 0.6 }
                    ]}>
                      {option.type === 'profile' ? 'Profile' : 'Group'}
                    </ThemedText>
                  </View>
                  {selectedAuthor?.type === option.type && selectedAuthor?.id === option.id && (
                    <ThemedText style={[styles.dropdownOptionCheck, { color: colors.tint }]}>
                      ✓
                    </ThemedText>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Platform Date/Time Pickers */}
      {showDatePicker && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e: any, d?: Date) => {
                  if (d) setTempDate(d);
                }}
              />
              <View style={styles.pickerActions}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: colors.background + 'CC', borderColor: colors.text + '30' }]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: colors.tint + '20', borderColor: colors.tint }]}
                  onPress={() => {
                    setEventDate(tempDate);
                    setShowDatePicker(false);
                  }}
                >
                  <ThemedText style={[styles.secondaryButtonText, { color: colors.tint }]}>Confirm</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showStartTimePicker && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowStartTimePicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
              <DateTimePicker
                value={tempStartTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e: any, d?: Date) => {
                  if (d) setTempStartTime(d);
                }}
              />
              <View style={styles.pickerActions}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: colors.background + 'CC', borderColor: colors.text + '30' }]}
                  onPress={() => setShowStartTimePicker(false)}
                >
                  <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: colors.tint + '20', borderColor: colors.tint }]}
                  onPress={() => {
                    setEventStartTime(tempStartTime);
                    setShowStartTimePicker(false);
                  }}
                >
                  <ThemedText style={[styles.secondaryButtonText, { color: colors.tint }]}>Confirm</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showEndTimePicker && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowEndTimePicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerModal, { backgroundColor: colors.background }]}>
              <DateTimePicker
                value={tempEndTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e: any, d?: Date) => {
                  if (d) setTempEndTime(d);
                }}
              />
              <View style={styles.pickerActions}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: colors.background + 'CC', borderColor: colors.text + '30' }]}
                  onPress={() => setShowEndTimePicker(false)}
                >
                  <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: colors.tint + '20', borderColor: colors.tint }]}
                  onPress={() => {
                    setEventEndTime(tempEndTime);
                    setShowEndTimePicker(false);
                  }}
                >
                  <ThemedText style={[styles.secondaryButtonText, { color: colors.tint }]}>Confirm</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  halfWidth: {
    flex: 1,
    marginBottom: 0,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    maxHeight: '60%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownOptionCheck: {
    fontSize: 18,
    fontWeight: '600',
  },
  authorOptionContent: {
    flex: 1,
  },
  authorOptionType: {
    fontSize: 12,
    marginTop: 2,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 0,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    gap: 12,
  },
  imagePreviewFrame: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewImage: {
    width: '100%',
    height: '100%',
  },
  aspectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  aspectButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  aspectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerModal: {
    width: '90%',
    maxWidth: 420,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  pickImageButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  pickImageButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
