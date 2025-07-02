import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Grid, List, Search, Filter, Camera, LayoutGrid, Layers, Trophy, Star, Zap, Award, Users, TrendingUp, Package, Trash2, AlertTriangle, CreditCard, FileText, CreditCard as CardIcon, MoreVertical, X, Edit, Eye, DollarSign, RefreshCw, Check, CheckCircle, BookOpen, Copy, ShoppingCart, Sun, Crop } from "lucide-react";
import Header from "@/components/header";
import HaloBlur from "@/components/halo-blur";
import Navigation from "@/components/navigation";

import CardDisplay from "../components/card-display";
import LoadingScreen from "@/components/LoadingScreen";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import avatarImage from "@assets/image_1750196240581.png";
import cardStackIcon from "@assets/image_1750351528484.png";
import goldCardsImage from "@assets/2ba6c853-16ca-4c95-a080-c551c3715411_1750361216149.png";
import goldenCardsIcon from "@assets/2ba6c853-16ca-4c95-a080-c551c3715411_1750366562526.png";
import type { User, Collection, Card, PersonalCard } from "@shared/schema";
import MilestoneCelebration from "@/components/MilestoneCelebration";
import { MilestoneDetector, type MilestoneData } from "@/utils/milestoneDetector";
import MilestoneTestTriggers from "@/utils/milestoneTestTriggers";
import TrophyAvatar from "@/components/TrophyAvatar";
import AnimatedCounter from "@/components/AnimatedCounter";

const getThemeGradient = (themeColors: string) => {
  const themeStyles: Record<string, string> = {
    "main+background": "linear-gradient(135deg, #1e3a8a 0%, #1f2937 100%)",
    "white+sky": "linear-gradient(135deg, #ffffff 0%, #0ea5e9 100%)",
    "red+navy": "linear-gradient(135deg, #dc2626 0%, #1e3a8a 100%)",
    "navy+bronze": "linear-gradient(135deg, #1e3a8a 0%, #a3a3a3 100%)",
    "white+red": "linear-gradient(135deg, #ffffff 0%, #dc2626 100%)",
    "white+blue": "linear-gradient(135deg, #ffffff 0%, #3b82f6 100%)",
    "gold+black": "linear-gradient(135deg, #fbbf24 0%, #000000 100%)",
    "green+white": "linear-gradient(135deg, #22c55e 0%, #ffffff 100%)",
    "red+black": "linear-gradient(135deg, #dc2626 0%, #000000 100%)",
    "blue+white+red": "linear-gradient(135deg, #3b82f6 0%, #ffffff 50%, #dc2626 100%)",
    "full+black": "#000000"
  };
  return themeStyles[themeColors] || "linear-gradient(135deg, #1e3a8a 0%, #1f2937 100%)";
};

const getThemeTextColor = (themeColors: string) => {
  const lightThemes = ["white+sky", "white+red", "white+blue", "green+white"];
  // Le thème full+black doit toujours afficher le texte en blanc
  if (themeColors === "full+black") {
    return "#ffffff";
  }
  return lightThemes.includes(themeColors) ? "#000000" : "#ffffff";
};


export default function Collections() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"cards" | "collections" | "deck">("cards");
  const [viewMode, setViewMode] = useState<"grid" | "gallery" | "carousel" | "list">("list");
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [isInitialAutoSelection, setIsInitialAutoSelection] = useState(false);
  
  // États pour le système de création de check-lists
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedChecklistCollection, setSelectedChecklistCollection] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Données pour les sélecteurs de marques et collections
  const brands = [
    { id: 'panini', name: 'Panini' },
    { id: 'futera', name: 'Futera' },
    { id: 'topps', name: 'Topps' }
  ];

  const collectionsByBrand: Record<string, string[]> = {
    'panini': ['OM 125 ans', 'Score ligue 1', 'Immaculate', 'Iconz'],
    'futera': ['Set OM'],
    'topps': ['UCC Flagship']
  };

  const seasonsByCollection: Record<string, string[]> = {
    'OM 125 ans': ['2024/25'], // Édition spéciale
    'Score ligue 1': ['2022/23'],
    'Immaculate': ['2022/23', '2024/25'],
    'Iconz': ['2024/25'],
    'Set OM': ['2021/22', '2022/23', '2024/25'],
    'UCC Flagship': ['2023/24', '2024/25']
  };

  // Fonction pour obtenir les années disponibles selon la collection
  const getAvailableYears = (collection: string) => {
    return seasonsByCollection[collection] || [];
  };

  // Fonction pour gérer la création de nouvelles check-lists
  const handleCreateChecklist = async () => {
    if (!selectedBrand || !selectedChecklistCollection || !selectedYear) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    try {
      const checklistName = `${selectedBrand.toUpperCase()} ${selectedChecklistCollection} ${selectedYear}`;
      
      const newCollection = {
        name: checklistName,
        season: selectedYear
      };

      const response = await fetch(`/api/collections`, {
        method: "POST",
        body: JSON.stringify(newCollection),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        // Invalider le cache des collections pour recharger la liste
        queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
        
        toast({
          title: "Check-list créée !",
          description: `La check-list ${checklistName} a été créée avec succès`,
          className: "bg-green-600 text-white",
        });

        // Réinitialiser le formulaire et fermer la modal
        setSelectedBrand('');
        setSelectedChecklistCollection('');
        setSelectedYear('');
        setShowChecklistModal(false);
      } else {
        throw new Error('Erreur lors de la création');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la check-list",
        variant: "destructive",
      });
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [showDeleteCardModal, setShowDeleteCardModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showCardFullscreen, setShowCardFullscreen] = useState(false);
  const [isCardRotated, setIsCardRotated] = useState(false);
  const [rotationStyle, setRotationStyle] = useState({ rotateX: 0, rotateY: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [cardRef, setCardRef] = useState<HTMLElement | null>(null);
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [showFeaturedPanel, setShowFeaturedPanel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [featuredDescription, setFeaturedDescription] = useState("");
  const [salePrice, setSalePrice] = useState('');
  const [saleDescription, setSaleDescription] = useState('');
  const [tradeOnly, setTradeOnly] = useState(false);
  const [editData, setEditData] = useState({
    playerName: '',
    teamName: '',
    cardType: '',
    reference: '',
    numbering: '',
    imageUrl: '',
    collectionId: '',
    season: '',
    condition: 'excellent'
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>("");
  const [playerSuggestions, setPlayerSuggestions] = useState<string[]>([]);
  const [teamSuggestions, setTeamSuggestions] = useState<string[]>([]);
  const [showPlayerSuggestions, setShowPlayerSuggestions] = useState(false);
  const [showTeamSuggestions, setShowTeamSuggestions] = useState(false);
  
  // Image editor states - new modern interface
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageEditorActiveTab, setImageEditorActiveTab] = useState('brightness');
  const [imageEditorBrightness, setImageEditorBrightness] = useState(100);
  const [imageEditorContrast, setImageEditorContrast] = useState(100);
  const [imageEditorRotation, setImageEditorRotation] = useState(0);
  const [imageEditorZoom, setImageEditorZoom] = useState(100);
  const [imageEditorPosition, setImageEditorPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalImageForEdit, setOriginalImageForEdit] = useState<string>("");
  const [editedImageResult, setEditedImageResult] = useState<string>("");
  const [saleFilter, setSaleFilter] = useState<'all' | 'available' | 'sold'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Milestone celebration state
  const [currentMilestone, setCurrentMilestone] = useState<MilestoneData | null>(null);
  const [collectionCompletions, setCollectionCompletions] = useState<Record<number, any>>({});
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 3D card rotation handlers optimisés
  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    if (!cardRef || !isCardRotated) return;
    
    e.preventDefault();
    const rect = cardRef.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    // Calculs optimisés avec interpolation plus douce
    const maxRotation = 12; // Réduit pour plus de fluidité
    const rotateY = (deltaX / (rect.width / 2)) * maxRotation;
    const rotateX = -(deltaY / (rect.height / 2)) * maxRotation;
    
    // Application immédiate sans setState pour éviter le lag
    if (cardRef) {
      const transform = `rotateX(${Math.max(-maxRotation, Math.min(maxRotation, rotateX))}deg) rotateY(${Math.max(-maxRotation, Math.min(maxRotation, rotateY))}deg) scale(${isMouseDown ? 1.02 : 1.05})`;
      cardRef.style.transform = transform;
    }
  };

  const handleCardMouseEnter = () => {
    setIsCardRotated(true);
    if (cardRef) {
      cardRef.style.transition = 'none'; // Désactiver transitions pour fluidité
    }
  };

  const handleCardMouseLeave = () => {
    setIsCardRotated(false);
    setIsMouseDown(false);
    // Retour fluide à la position initiale
    if (cardRef) {
      cardRef.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
      cardRef.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    }
  };

  const handleCardMouseDown = () => {
    setIsMouseDown(true);
  };

  const handleCardMouseUp = () => {
    setIsMouseDown(false);
  };

  // Image editor functions - new modern system
  const openImageEditor = (imageUrl: string) => {
    setOriginalImageForEdit(imageUrl);
    setEditedImageResult(imageUrl);
    setImageEditorActiveTab('brightness');
    setImageEditorBrightness(100);
    setImageEditorContrast(100);
    setImageEditorRotation(0);
    setImageEditorZoom(100);
    setImageEditorPosition({ x: 0, y: 0 });
    setShowImageEditor(true);
  };

  // Functions for interactive crop and zoom
  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (imageEditorActiveTab === 'crop') {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (isDragging && imageEditorActiveTab === 'crop') {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setImageEditorPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleImageMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (zoom: number) => {
    setImageEditorZoom(zoom);
  };

  const applyImageEdits = () => {
    // Simuler l'application des modifications d'image
    // En production, ici vous utiliseriez une bibliothèque comme fabric.js ou canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Sauvegarder l'état du contexte
      ctx!.save();
      
      // Appliquer la rotation
      ctx!.translate(canvas.width / 2, canvas.height / 2);
      ctx!.rotate((imageEditorRotation * Math.PI) / 180);
      ctx!.translate(-canvas.width / 2, -canvas.height / 2);
      
      // Appliquer luminosité et contraste via filter
      ctx!.filter = `brightness(${imageEditorBrightness}%) contrast(${imageEditorContrast}%)`;
      
      // Dessiner l'image
      ctx!.drawImage(img, 0, 0);
      
      // Restaurer l'état du contexte
      ctx!.restore();
      
      // Convertir en base64
      const editedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
      setEditedImageResult(editedImageUrl);
      setEditImagePreview(editedImageUrl);
      setEditData(prev => ({ ...prev, imageUrl: editedImageUrl }));
      
      toast({
        title: "Image retouchée",
        description: "Les modifications ont été appliquées avec succès",
        className: "bg-green-600 border-green-600 text-white",
      });
    };
    
    img.src = originalImageForEdit;
  };

  const rotateImage = (direction: 'left' | 'right') => {
    const newRotation = direction === 'left' 
      ? imageEditorRotation - 90 
      : imageEditorRotation + 90;
    setImageEditorRotation(newRotation % 360);
  };

  const resetImageEditor = () => {
    setImageEditorBrightness(100);
    setImageEditorContrast(100);
    setImageEditorRotation(0);
    setImageEditorZoom(100);
    setImageEditorPosition({ x: 0, y: 0 });
    setEditedImageResult(originalImageForEdit);
  };

  // Get current user first
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Use authenticated user data directly for better production compatibility
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users/me"],
    enabled: !!currentUser,
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: ["/api/users/me/collections"],
    staleTime: 20 * 60 * 1000, // 20 minutes pour réduire les requêtes en production
    gcTime: 60 * 60 * 1000, // 1 heure en mémoire
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Ne pas recharger automatiquement
    enabled: !!currentUser, // Only fetch when we have authenticated user
  });

  // Query pour les cartes personnelles
  const { data: personalCards = [], isLoading: personalCardsLoading } = useQuery<any[]>({
    queryKey: ["/api/personal-cards"],
    staleTime: 5 * 60 * 1000,
    enabled: activeTab === "cards",
  });

  // Query pour les decks de l'utilisateur avec cache optimisé
  const { data: userDecks = [], isLoading: decksLoading } = useQuery<any[]>({
    queryKey: ["/api/decks"],
    staleTime: 10 * 60 * 1000, // Cache pendant 10 minutes
    gcTime: 20 * 60 * 1000, // Garde en cache 20 minutes  
    refetchOnWindowFocus: false, // Ne pas refetch au focus
    refetchOnMount: false, // Ne pas refetch au montage si on a des données en cache
  });

  // Query pour obtenir les détails complets des decks avec cartes pour prévisualisation
  const { data: deckPreviews = [] } = useQuery({
    queryKey: ['/api/decks/previews', userDecks?.map(d => d.id).join(',')],
    queryFn: async () => {
      if (!userDecks?.length) return [];
      
      const previews = await Promise.all(
        userDecks.map(async (deck: any) => {
          try {
            const response = await fetch(`/api/decks/${deck.id}`);
            if (response.ok) {
              const deckWithCards = await response.json();
              return {
                ...deck,
                previewCards: deckWithCards.cards.slice(0, 3),
                totalCards: deckWithCards.cards.length,
                cardCount: deckWithCards.cards.length
              };
            }
            return { ...deck, previewCards: [] };
          } catch {
            return { ...deck, previewCards: [] };
          }
        })
      );
      return previews;
    },
    enabled: activeTab === "deck" && !!userDecks?.length,
    staleTime: 15 * 60 * 1000, // Cache pendant 15 minutes
    gcTime: 30 * 60 * 1000, // Garde en cache 30 minutes
    refetchOnWindowFocus: false, // Ne pas refetch au focus
    refetchOnMount: false, // Ne pas refetch au montage si on a des données en cache
  });

  // Filtrer et rechercher les cartes personnelles
  const filteredPersonalCards = personalCards.filter(card => {
    // Filtre par statut de vente
    if (saleFilter === 'available') {
      // En vente : cartes avec isForTrade=true ET un prix, mais pas vendues
      if (!card.isForTrade || !card.tradePrice || card.isSold) return false;
    } else if (saleFilter === 'sold') {
      // Vendues : seulement les cartes avec isSold=true
      if (!card.isSold) return false;
    } 
    // Pour 'all', on affiche toutes les cartes sans filtrage par statut de vente
    
    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const playerMatch = card.playerName?.toLowerCase().includes(query);
      const teamMatch = card.teamName?.toLowerCase().includes(query);
      return playerMatch || teamMatch;
    }
    
    return true;
  }).sort((a, b) => {
    // Trier les cartes vendues à la fin de la liste
    if (a.isSold && !b.isSold) return 1;
    if (!a.isSold && b.isSold) return -1;
    return 0;
  });

  // Générer les suggestions d'autocomplétion
  const generateSuggestions = (query: string) => {
    if (!query.trim()) return [];
    
    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();
    
    personalCards.forEach(card => {
      if (card.playerName && card.playerName.toLowerCase().includes(queryLower)) {
        suggestions.add(card.playerName);
      }
      if (card.teamName && card.teamName.toLowerCase().includes(queryLower)) {
        suggestions.add(card.teamName);
      }
    });
    
    return Array.from(suggestions).slice(0, 5);
  };

  // Mettre à jour les suggestions quand la recherche change
  // Gérer le paramètre tab dans l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'decks') {
      setActiveTab('deck');
    }
  }, []);

  useEffect(() => {
    if (personalCards.length === 0) return;
    
    const suggestions = generateSuggestions(searchQuery);
    setSearchSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0 && searchQuery.trim().length > 0);
  }, [searchQuery]);

  // Fonction pour calculer le pourcentage de completion RÉEL avec données personnelles
  const getCollectionCompletion = (collection: Collection) => {
    // Calculer à partir des cartes personnelles de l'utilisateur pour cette collection
    const collectionPersonalCards = personalCards.filter(
      card => card.collectionId === collection.id
    );
    
    const ownedCount = collectionPersonalCards.length;
    const totalCards = collection.totalCards || 0;
    
    return {
      totalCards,
      ownedCards: ownedCount,
      percentage: totalCards > 0 ? Math.round((ownedCount / totalCards) * 100) : 0
    };
  };

  // Query for all user cards when no collection is selected - Optimized with aggressive caching
  const { data: allUserCardsResponse, isLoading: allCardsLoading } = useQuery<{cards: Card[], pagination?: any}>({
    queryKey: ["/api/cards/all"],
    enabled: !selectedCollection && activeTab === "cards",
    staleTime: 60 * 60 * 1000, // Cache pendant 1 heure pour performance maximale
    gcTime: 3 * 60 * 60 * 1000, // Garde en cache 3 heures
    refetchOnWindowFocus: false, // Ne pas refetch au focus
    refetchOnMount: false, // Ne pas refetch au montage si on a des données en cache
    refetchInterval: false, // Pas de refetch automatique
    retry: 1, // Réduire les tentatives pour accélérer l'affichage
  });

  // Query for specific collection cards - Optimized with aggressive caching
  const { data: cardsResponse, isLoading: collectionCardsLoading } = useQuery<{cards: Card[], pagination?: any}>({
    queryKey: [`/api/collections/${selectedCollection}/cards`],
    enabled: !!selectedCollection && activeTab === "cards",
    staleTime: 30 * 60 * 1000, // Cache pendant 30 minutes pour réduire les requêtes en production
    gcTime: 2 * 60 * 60 * 1000, // Garde en cache 2 heures
    refetchOnWindowFocus: false, // Ne pas refetch au focus
    refetchOnMount: false, // Ne pas refetch au montage si on a des données en cache
    refetchInterval: false, // Pas de refetch automatique
    retry: 1, // Réduire les tentatives pour accélérer l'affichage en cas d'erreur
  });

  // Loading state for cards
  const cardsLoading = allCardsLoading || collectionCardsLoading;

  // Extract cards from response - use all user cards if no collection selected
  const cards = selectedCollection 
    ? (cardsResponse?.cards || [])
    : (Array.isArray(allUserCardsResponse) ? allUserCardsResponse : (allUserCardsResponse?.cards || []));

  // Auto-sélection FORCÉE de la collection Score Ligue 1 par défaut sur TOUS les comptes
  useEffect(() => {
    if (!collections || collections.length === 0) {
      console.log('❌ Collections pas encore chargées');
      return;
    }
    
    console.log('🔍 Collections disponibles:', collections.map(c => c.name));
    
    // Chercher la collection "SCORE LIGUE 1" et la sélectionner automatiquement
    const scoreLigue1Collection = collections.find(collection => 
      collection.name.toLowerCase().includes('score ligue 1') ||
      collection.name.toLowerCase().includes('score ligue') ||
      collection.season === '23/24'
    );
    
    console.log('🎯 Collection Score Ligue 1 trouvée:', scoreLigue1Collection?.name, 'ID:', scoreLigue1Collection?.id);
    console.log('📍 Collection actuellement sélectionnée:', selectedCollection);
    
    // FORCE la sélection même si une autre collection était sélectionnée
    if (scoreLigue1Collection && selectedCollection !== scoreLigue1Collection.id && !isInitialAutoSelection) {
      console.log('✅ FORÇAGE auto-sélection de la collection:', scoreLigue1Collection.name, 'ID:', scoreLigue1Collection.id);
      
      // Petite temporisation pour s'assurer que tout est bien chargé
      setTimeout(() => {
        setSelectedCollection(scoreLigue1Collection.id);
        setActiveTab("cards"); // Basculer vers l'onglet cartes pour afficher la collection
        setIsInitialAutoSelection(true); // Marquer que l'auto-sélection initiale est faite
        console.log('🔄 Collection forcée vers:', scoreLigue1Collection.name);
      }, 100);
    } else if (!scoreLigue1Collection) {
      console.log('⚠️ Aucune collection Score Ligue 1 trouvée dans:', collections.map(c => c.name));
    }
  }, [collections, selectedCollection]); // Remettre selectedCollection pour suivre les changements

  // Supprimer l'effet automatique qui force le retour sur cartes
  // L'auto-sélection se fait maintenant uniquement dans le setTimeout ci-dessus

  // Effect to check for milestones when collections data changes
  useEffect(() => {
    if (!collections || collections.length === 0) return;

    // Calculate all collection completions
    const newCompletions: Record<number, any> = {};
    
    collections.forEach(collection => {
      const completion = getCollectionCompletion(collection);
      newCompletions[collection.id] = completion;

      // Check for milestones if we have previous data to compare
      const previousCompletion = collectionCompletions[collection.id];
      
      if (previousCompletion && completion.percentage !== previousCompletion.percentage) {
        // Check for completion milestones
        const milestone = MilestoneDetector.checkAllMilestones(
          collection as any,
          completion,
          previousCompletion,
          collections as any,
          newCompletions
        );

        if (milestone) {
          setCurrentMilestone(milestone);
        }
      }
    });

    // Update the completions state only if it has changed
    setCollectionCompletions(prev => {
      const hasChanged = JSON.stringify(prev) !== JSON.stringify(newCompletions);
      return hasChanged ? newCompletions : prev;
    });
  }, [collections]);

  // Effect to check for first collection milestone when user first loads the app
  useEffect(() => {
    if (!collections || collections.length === 0) return;
    
    // Check for first collection milestone only once
    const completions: Record<number, any> = {};
    collections.forEach(collection => {
      completions[collection.id] = getCollectionCompletion(collection);
    });

    const firstCollectionMilestone = MilestoneDetector.checkFirstCollectionMilestone(
      collections as any,
      completions
    );

    if (firstCollectionMilestone) {
      setCurrentMilestone(firstCollectionMilestone);
    }
  }, [collections]); // Only run when collections first load

  // Development helper: Add test milestone triggers
  useEffect(() => {
    // Add global functions for testing milestones
    if (typeof window !== 'undefined') {
      (window as any).testMilestone = (type?: string) => {
        const milestone = MilestoneTestTriggers.createTestMilestone(type as any || 'completion');
        setCurrentMilestone(milestone);
      };

      (window as any).testRandomMilestone = () => {
        const milestone = MilestoneTestTriggers.getRandomMilestone();
        setCurrentMilestone(milestone);
      };

      (window as any).testCompletionMilestone = (percentage: number) => {
        const milestone = MilestoneTestTriggers.createCompletionMilestone(percentage);
        setCurrentMilestone(milestone);
      };
    }
  }, []);

  // Mutation pour mettre à jour les paramètres de vente
  const updateSaleSettingsMutation = useMutation({
    mutationFn: async ({ cardId, price, description, tradeOnly }: {
      cardId: number;
      price: string;
      description: string;
      tradeOnly: boolean;
    }) => {
      console.log("Saving sale settings:", { cardId, price, description, tradeOnly });
      // Utiliser la route pour cartes personnelles
      return apiRequest("PATCH", `/api/personal-cards/${cardId}/sale-settings`, {
        isForSale: true,
        isForTrade: true,
        tradePrice: price,
        tradeDescription: description,
        tradeOnly
      });
    },
    onSuccess: (updatedCard) => {
      // Mettre à jour les cartes personnelles
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/marketplace"] });
      
      // Vider les champs uniquement après succès
      setSalePrice('');
      setSaleDescription('');
      setTradeOnly(false);
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de vente ont été mis à jour.",
        className: "bg-green-600 text-white border-green-700"
      });
      
      setShowTradePanel(false);
      setShowOptionsPanel(false);
      setSelectedCard(null);
    },
    onError: (error) => {
      console.error("Error saving sale settings:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour retirer de la vente
  const removeFromSaleMutation = useMutation({
    mutationFn: async (cardId: number) => {
      return apiRequest("PATCH", `/api/personal-cards/${cardId}/sale-settings`, {
        isForSale: false,
        isForTrade: false,
        tradePrice: null,
        tradeDescription: null,
        tradeOnly: false
      });
    },
    onSuccess: (updatedCard) => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/marketplace"] });
      
      toast({
        title: "Carte retirée de la vente",
        description: "La carte n'est plus disponible à la vente.",
        className: "bg-green-600 text-white border-green-700"
      });
      
      setShowOptionsPanel(false);
      setSelectedCard(null);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de retirer la carte de la vente.",
        variant: "destructive",
      });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (collectionId: number) => {
      return apiRequest("DELETE", `/api/collections/${collectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      toast({
        title: "Collection supprimée",
        description: "La collection a été supprimée avec succès.",
        className: "bg-green-600 text-white border-green-700"
      });
      setShowDeleteModal(false);
      setCollectionToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la collection.",
        variant: "destructive"
      });
    }
  });

  // Mutation pour supprimer une carte
  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: number) => {
      return apiRequest("DELETE", `/api/personal-cards/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/marketplace"] });
      
      toast({
        title: "Carte supprimée",
        description: "La carte a été supprimée avec succès.",
        className: "bg-green-600 text-white border-green-700"
      });
      
      setShowDeleteCardModal(false);
      setCardToDelete(null);
      setShowOptionsPanel(false);
      setSelectedCard(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la carte.",
        variant: "destructive"
      });
    }
  });

  const handleMarkAsSold = async () => {
    if (!selectedCard) return;
    
    try {
      await apiRequest("PATCH", `/api/personal-cards/${selectedCard.id}/sale-settings`, {
        isSold: true,
        isForSale: false,
        isForTrade: false
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/cards/marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/all"] });
      
      toast({
        title: "Carte marquée comme vendue",
        description: "La carte est maintenant disponible dans l'onglet 'Vendues'.",
        className: "bg-green-600 text-white border-green-700"
      });
      setShowOptionsPanel(false);
      setSelectedCard(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la carte comme vendue.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFromSale = () => {
    if (!selectedCard) return;
    removeFromSaleMutation.mutate(selectedCard.id);
  };

  const handleDeleteCollection = (collection: Collection) => {
    setCollectionToDelete(collection);
    setShowDeleteModal(true);
  };

  const confirmDeleteCollection = () => {
    if (collectionToDelete) {
      deleteCollectionMutation.mutate(collectionToDelete.id);
    }
  };

  const handleDeleteCard = (card: Card) => {
    setCardToDelete(card);
    setShowDeleteCardModal(true);
    setShowOptionsPanel(false);
  };

  const confirmDeleteCard = () => {
    if (cardToDelete) {
      deleteCardMutation.mutate(cardToDelete.id);
    }
  };

  const handleDuplicateCard = async (card: any) => {
    if (!card) return;
    
    try {
      // Créer une nouvelle carte avec les mêmes données selon le schéma personalCards
      const duplicateData = {
        playerName: card.playerName,
        teamName: card.teamName,
        cardType: card.cardType,
        reference: card.reference,
        numbering: card.numbering,
        season: card.season,
        imageUrl: card.imageUrl,
        condition: card.condition || "excellent", // Utiliser la condition existante ou "excellent" par défaut
        isForSale: false,
        isSold: false,
        isForTrade: false,
        tradeOnly: false
      };

      console.log("Duplicating card with data:", duplicateData);

      await apiRequest("POST", "/api/personal-cards", duplicateData);
      
      // Invalider les caches pour rafraîchir l'affichage
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/all"] });
      
      toast({
        title: "Carte dupliquée",
        description: "La carte a été dupliquée avec succès.",
        className: "bg-green-600 text-white border-green-700"
      });
      
      setShowOptionsPanel(false);
      setSelectedCard(null);
    } catch (error) {
      console.error("Error duplicating card:", error);
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer la carte.",
        variant: "destructive"
      });
    }
  };

  const handleEditCard = (card: any) => {
    if (!card) return;
    
    setEditData({
      playerName: card.playerName || '',
      teamName: card.teamName || '',
      cardType: card.cardType || '',
      reference: card.reference || '',
      numbering: card.numbering || '',
      imageUrl: card.imageUrl || '',
      collectionId: card.collectionId || '',
      season: card.season || '',
      condition: card.condition || 'excellent'
    });
    
    // Initialiser l'aperçu de l'image avec l'image actuelle
    setEditImagePreview(card.imageUrl || '');
    setEditImageFile(null);
    
    setShowOptionsPanel(false);
    setShowEditModal(true);
  };

  const handleEditImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonctions d'autocomplétion
  const handlePlayerNameChange = (value: string) => {
    setEditData({...editData, playerName: value});
    
    if (value.length > 2) {
      // Générer des suggestions basées sur les cartes existantes
      const allCards = cards || [];
      const suggestions = allCards.filter((card: any) => 
        card.playerName && card.playerName.toLowerCase().includes(value.toLowerCase())
      ).map((card: any) => card.playerName);
      
      const uniqueSuggestions = Array.from(new Set(suggestions)).slice(0, 5);
      setPlayerSuggestions(uniqueSuggestions);
      setShowPlayerSuggestions(uniqueSuggestions.length > 0);
    } else {
      setShowPlayerSuggestions(false);
    }
  };

  const handleTeamNameChange = (value: string) => {
    setEditData({...editData, teamName: value});
    
    if (value.length > 2) {
      // Générer des suggestions basées sur les cartes existantes
      const allCards = cards || [];
      const suggestions = allCards.filter((card: any) => 
        card.teamName && card.teamName.toLowerCase().includes(value.toLowerCase())
      ).map((card: any) => card.teamName);
      
      const uniqueSuggestions = Array.from(new Set(suggestions)).slice(0, 5);
      setTeamSuggestions(uniqueSuggestions);
      setShowTeamSuggestions(uniqueSuggestions.length > 0);
    } else {
      setShowTeamSuggestions(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCard) return;

    try {
      let imageUrl = editData.imageUrl;
      
      // Si une nouvelle image a été uploadée, l'encoder en base64
      if (editImageFile) {
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(editImageFile);
        });
      }

      const updateData = {
        ...editData,
        imageUrl
      };

      await apiRequest("PATCH", `/api/personal-cards/${selectedCard.id}`, updateData);
      
      // Invalider les caches pour rafraîchir l'affichage
      queryClient.invalidateQueries({ queryKey: ["/api/personal-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/all"] });
      
      toast({
        title: "Carte modifiée",
        description: "Les modifications ont été sauvegardées avec succès.",
        className: "bg-green-600 text-white border-green-700"
      });
      
      setShowEditModal(false);
      setSelectedCard(null);
      
      // Réinitialiser les états
      setEditImageFile(null);
      setEditImagePreview("");
      setShowPlayerSuggestions(false);
      setShowTeamSuggestions(false);
    } catch (error) {
      console.error("Error editing card:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive"
      });
    }
  };

  const handleTabChange = (tab: "collections" | "cards" | "deck") => {
    setActiveTab(tab);
    if (tab === "collections") {
      setSelectedCollection(null);
    }
  };

  const handleSaveSaleSettings = () => {
    if (!selectedCard) return;
    
    updateSaleSettingsMutation.mutate({
      cardId: selectedCard.id,
      price: salePrice,
      description: saleDescription,
      tradeOnly: tradeOnly
    });
  };

  // Affichage conditionnel du chargement - Ne montrer LoadingScreen que lors du premier chargement
  if ((userLoading && !user) || (collectionsLoading && !collections)) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(216,46%,13%)]">
      <HaloBlur />
      <Header title="Mes cartes" />
      <main className="relative z-10 px-4 pb-24">
        {/* User Profile Section */}
        {user && (
          <div className="flex flex-col items-center text-center mb-4 mt-2">
            <TrophyAvatar 
              userId={user.id}
              avatar={user.avatar || undefined}
              size="lg"
            />
            <h2 className="text-xl font-bold text-white mb-2 font-luckiest">{user.name || user.username}</h2>
            <div className="flex items-center space-x-4 text-sm text-[hsl(212,23%,69%)]">
              <div className="flex items-center space-x-1">
                <AnimatedCounter 
                  targetValue={(() => {
                    // Compter uniquement les cartes personnelles affichées dans l'onglet "Cartes"
                    // (en excluant les vendues pour correspondre au filtrage de l'onglet)
                    const visibleCardsCount = personalCards?.filter(card => !card.isSold).length || 0;
                    return visibleCardsCount;
                  })()} 
                  duration={2}
                  className="font-medium text-white"
                />
                <span>cartes</span>
              </div>
              <div className="flex items-center space-x-1">
                <AnimatedCounter 
                  targetValue={userDecks?.length || 0} 
                  duration={2.2}
                  className="font-medium text-white"
                />
                <span>decks</span>
              </div>
              <div className="flex items-center space-x-1">
                <AnimatedCounter 
                  targetValue={user.followersCount || 0} 
                  duration={2.5}
                  className="font-medium text-white"
                />
                <span>abonnés</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs - Horizontal Scroll */}
        <div className="overflow-x-auto scrollbar-hide mb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex space-x-2 bg-[hsl(214,35%,22%)] rounded-xl p-1 min-w-max">
            <button
              onClick={() => handleTabChange("cards")}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === "cards" 
                  ? "bg-primary text-primary-foreground shadow-md transform scale-[1.02]" 
                  : "text-gray-400 hover:text-white hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <CardIcon className="w-4 h-4" />
              Cartes
            </button>

            <button
              onClick={() => handleTabChange("collections")}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === "collections" 
                  ? "bg-primary text-primary-foreground shadow-md transform scale-[1.02]" 
                  : "text-gray-400 hover:text-white hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <Layers className="w-4 h-4" />
              Check-lists
            </button>

            <button
              onClick={() => handleTabChange("deck")}
              className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === "deck" 
                  ? "bg-primary text-primary-foreground shadow-md transform scale-[1.02]" 
                  : "text-gray-400 hover:text-white hover:bg-[hsl(214,35%,30%)]"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Decks
            </button>

          </div>
        </div>

        {/* Collections Tab Content */}
        {activeTab === "collections" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins mb-4">Toutes les check-lists</h3>
            {/* Add Collection Button - Moved to top */}
            <div 
              onClick={() => setShowChecklistModal(true)}
              className="w-full bg-[hsl(214,35%,22%)] rounded-2xl border-2 border-dashed border-[hsl(214,35%,30%)] cursor-pointer hover:border-[hsl(9,85%,67%)] transition-colors group p-4 flex flex-col items-center justify-center text-center"
            >
              <div className="w-10 h-10 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white font-poppins text-base">Nouvelle check-list</h3>
            </div>

            {collections?.map((collection) => {
              const completion = getCollectionCompletion(collection);
              return (
                <div key={collection.id}>
                  <div 
                    onClick={() => {
                      setLocation(`/collection/${collection.id}`);
                    }}
                    className="w-full bg-gradient-radial from-[hsl(214,35%,22%)] from-0% to-[hsl(216,46%,13%)] to-100% rounded-2xl overflow-hidden cursor-pointer group relative transform transition-all duration-300 hover:scale-[1.02] border-2 border-yellow-500/50 hover:border-yellow-400/70"
                  >
                    {/* Header with title and delete button */}
                    <div className="p-4 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-white font-poppins text-lg">{collection.name}</h3>
                          <p className="text-white/60 text-sm italic">{collection.season || 'Saison non spécifiée'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {!collection.name?.includes("SCORE LIGUE 1") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCollection(collection);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
                              title="Supprimer la collection"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card display area */}
                    <div className="h-32 relative flex items-center justify-center overflow-hidden px-4 pb-3">
                      <div className="relative w-full max-w-md h-32 flex items-center justify-center">
                        {/* Main card with golden cards image and effects */}
                        <div className="relative w-32 h-32 bg-gradient-to-br from-yellow-900/30 via-yellow-800/40 to-amber-900/50 rounded-2xl p-3 shadow-2xl flex items-center justify-center border border-yellow-500/20 group hover:scale-105 transition-all duration-300">
                          {/* Golden glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-amber-500/5 to-yellow-600/10 rounded-2xl animate-pulse"></div>
                          
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent rounded-2xl transform -skew-x-12 animate-shimmer"></div>
                          
                          <img 
                            src={goldenCardsIcon}
                            alt="Golden trading cards"
                            className="w-24 h-24 object-contain rounded-lg relative z-10 filter drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-300"
                            style={{
                              filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.3)) brightness(1.1) contrast(1.1)'
                            }}
                          />
                          
                          {/* Sparkle effects */}
                          <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                          <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-amber-300 rounded-full animate-pulse delay-300"></div>
                          <div className="absolute top-1/2 left-2 w-1 h-1 bg-yellow-500 rounded-full animate-pulse delay-700"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="px-4 pb-4">
                      <div className="w-full bg-[hsl(214,35%,15%)] rounded-full h-2">
                        <div 
                          className="bg-[hsl(9,85%,67%)] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completion.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-white/60 mt-1">
                        <span>{completion.percentage}% complété</span>
                        <span>{completion.ownedCards} cartes acquises</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}



        {/* Cards Tab Content - Personal Cards */}
        {activeTab === "cards" && (
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white font-poppins mb-4">Mes cartes</h3>
              
              {/* Controls Row - Filter Tabs and View Icons */}
              <div className="flex items-center justify-between">
                {/* Filter Tabs */}
                <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setSaleFilter('all')}
                    className={`px-3 py-1 rounded text-xs transition-all ${
                      saleFilter === 'all' 
                        ? "bg-primary text-primary-foreground" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setSaleFilter('available')}
                    className={`px-3 py-1 rounded text-xs transition-all ${
                      saleFilter === 'available' 
                        ? "bg-primary text-primary-foreground" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    En vente
                  </button>
                  <button
                    onClick={() => setSaleFilter('sold')}
                    className={`px-3 py-1 rounded text-xs transition-all ${
                      saleFilter === 'sold' 
                        ? "bg-primary text-primary-foreground" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Vendues
                  </button>
                </div>

                {/* View Mode Icons */}
                <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "list" 
                        ? "bg-primary text-primary-foreground" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "grid" 
                        ? "bg-primary text-primary-foreground" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search Bar with Autocomplete */}
            <div className="relative mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher par joueur ou équipe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-3 bg-[hsl(214,35%,15%)] border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[hsl(214,35%,18%)] border border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-[hsl(214,35%,25%)] transition-colors border-b border-gray-700 last:border-b-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>



            {personalCardsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPersonalCards && filteredPersonalCards.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredPersonalCards.map((card: any) => (
                    <div 
                      key={card.id} 
                      className={`bg-[hsl(214,35%,22%)] rounded-lg p-3 hover:bg-[hsl(214,35%,25%)] transition-colors cursor-pointer relative ${card.isSold ? 'opacity-75' : ''}`}
                      onClick={() => setSelectedCard(card)}
                    >
                      {card.isSold && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
                          <div className="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold text-sm">
                            VENDUE
                          </div>
                        </div>
                      )}
                      {card.imageUrl && (
                        <img 
                          src={card.imageUrl} 
                          alt={`${card.playerName || 'Carte'}`}
                          className={`w-full h-32 object-cover rounded-md mb-2 ${card.isSold ? 'grayscale' : ''}`}
                        />
                      )}
                      <div className="space-y-1">
                        {card.playerName && (
                          <h4 className="text-white font-medium text-sm truncate">{card.playerName}</h4>
                        )}
                        {card.teamName && (
                          <p className="text-gray-400 text-xs truncate">{card.teamName}</p>
                        )}
                        <p className="text-gray-500 text-xs">{card.cardType}</p>
                        {!card.isSold && card.isForTrade && card.tradePrice && (
                          <div className="absolute bottom-2 right-2">
                            <span className="text-primary text-xs font-medium">
                              {card.tradePrice?.replace('$', '')}€
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // List view
                <div className="space-y-3">
                  {filteredPersonalCards.map((card: any) => (
                    <div 
                      key={card.id} 
                      className={`bg-[hsl(214,35%,22%)] rounded-lg p-4 hover:bg-[hsl(214,35%,25%)] transition-colors cursor-pointer flex items-center gap-4 relative ${card.isSold ? 'opacity-75' : ''}`}
                      onClick={() => setSelectedCard(card)}
                    >
                      {card.isSold && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-full font-bold text-xs z-10">
                          VENDUE
                        </div>
                      )}
                      {card.imageUrl && (
                        <img 
                          src={card.imageUrl} 
                          alt={`${card.playerName || 'Carte'}`}
                          className={`w-20 h-28 object-cover rounded-md flex-shrink-0 ${card.isSold ? 'grayscale' : ''}`}
                        />
                      )}
                      <div className="flex-1 space-y-1">
                        {card.playerName && (
                          <h4 className="text-white font-medium">{card.playerName}</h4>
                        )}
                        {card.teamName && (
                          <p className="text-gray-400 text-sm">{card.teamName}</p>
                        )}
                        <p className="text-gray-500 text-sm">{card.cardType}</p>
                      </div>
                      {!card.isSold && card.isForTrade && card.tradePrice && (
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-medium">{card.tradePrice?.replace('$', '')}€</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <CardIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2 text-lg">Aucune carte trouvée</div>
                <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed mb-6 max-w-md mx-auto">
                  {searchQuery ? "Aucune carte ne correspond à votre recherche." : "Ajoute tes cartes personnelles pour les organiser et les mettre en vente."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Deck Tab Content */}
        {activeTab === "deck" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-poppins mb-4">Mes Decks</h3>
            
            {/* Add Deck Button */}
            <div 
              onClick={() => setLocation("/create-deck")}
              className="w-full bg-[hsl(214,35%,22%)] rounded-2xl border-2 border-dashed border-[hsl(214,35%,30%)] cursor-pointer hover:border-[hsl(9,85%,67%)] transition-colors group p-4 flex flex-col items-center justify-center text-center"
            >
              <div className="w-10 h-10 bg-[hsl(9,85%,67%)] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white font-poppins text-base">Nouveau Deck</h3>
            </div>

            {/* Decks List */}
            {decksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[hsl(214,35%,22%)] rounded-2xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-20 bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : userDecks.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-6">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                </div>
                <div className="text-gray-400 mb-4 text-lg">
                  Tu n'as pas encore créé de deck.
                </div>
                <p className="text-[hsl(212,23%,69%)] text-sm leading-relaxed mb-6 max-w-md mx-auto">
                  Crée ton premier deck de cartes et montre-le à ta communauté.
                </p>
                <button 
                  onClick={() => setLocation("/create-deck")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Créer mon premier deck
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {(deckPreviews.length > 0 ? deckPreviews : userDecks).map((deck: any) => (
                  <div 
                    key={deck.id} 
                    onClick={() => {
                      // Vérifier que le deck existe avant la navigation
                      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deck.id}`] });
                      setLocation(`/deck/${deck.id}`);
                    }}
                    className="rounded-2xl p-4 border-2 border-yellow-500/50 hover:border-yellow-400/70 transition-all cursor-pointer hover:scale-[1.02] transform relative overflow-hidden"
                    style={{
                      background: deck.themeColors ? getThemeGradient(deck.themeColors) : "hsl(214,35%,22%)"
                    }}
                  >
                    {/* Effet d'étoiles filantes pour les decks complets */}
                    {deck.previewCards && deck.previewCards.length === 9 && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {Array.from({length: 8}).map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-px h-8 bg-gradient-to-b from-transparent via-yellow-300 to-transparent opacity-70"
                            style={{
                              top: `${-10 + Math.random() * 20}%`,
                              left: `${Math.random() * 100}%`,
                              transform: `rotate(${20 + Math.random() * 20}deg)`,
                              animation: `shooting-star ${2 + Math.random() * 3}s ease-in-out infinite`,
                              animationDelay: `${Math.random() * 4}s`
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <h4 className="font-bold text-lg font-luckiest" style={{
                        color: deck.themeColors ? getThemeTextColor(deck.themeColors) : "#ffffff"
                      }}>{deck.name}</h4>
                      <span className="text-xs" style={{
                        color: deck.themeColors ? `${getThemeTextColor(deck.themeColors)}80` : "#9ca3af"
                      }}>{deck.totalCards || deck.cardCount || 0}</span>
                    </div>
                    
                    {/* Preview des cartes */}
                    <div className="h-32 rounded-lg overflow-hidden bg-gradient-to-r from-gray-800 to-gray-700 flex items-center p-3">
                      {deck.previewCards && deck.previewCards.length > 0 ? (
                        <div className={`flex w-full perspective-1000 ${
                          deck.previewCards.length === 1 ? 'justify-center' : 
                          deck.previewCards.length === 2 ? 'justify-center space-x-4' : 
                          'space-x-3'
                        }`}>
                          {deck.previewCards.map((cardData: any, index: number) => {
                            // Calculer la transformation selon le nombre de cartes
                            let transform = '';
                            if (deck.previewCards.length === 1) {
                              transform = 'rotateY(0deg) rotateX(10deg)';
                            } else if (deck.previewCards.length === 2) {
                              transform = `rotateY(${index === 0 ? -10 : 10}deg) rotateX(10deg)`;
                            } else {
                              transform = `rotateY(${-15 + index * 15}deg) rotateX(10deg)`;
                            }
                            
                            return (
                              <div 
                                key={index} 
                                className={`h-24 relative transform-gpu ${
                                  deck.previewCards.length === 1 ? 'w-20' :
                                  deck.previewCards.length === 2 ? 'w-20' :
                                  'flex-1'
                                }`}
                                style={{
                                  transform,
                                  transformStyle: 'preserve-3d'
                                }}
                              >
                                {cardData.card.imageUrl ? (
                                  <div className="w-full h-full rounded-lg overflow-hidden shadow-lg border-2 border-white/20 relative">
                                    <img 
                                      src={cardData.card.imageUrl} 
                                      alt={cardData.card.playerName}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs text-center p-2 shadow-lg border-2 border-white/20">
                                    <div>
                                      <div className="font-bold text-xs mb-1">{cardData.card.playerName}</div>
                                      <div className="text-xs opacity-80">{cardData.card.teamName}</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full text-white font-bold">
                          Deck vide - Voir le deck
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Card Detail Modal - Fullscreen with slide animation */}
        {selectedCard && (
          <div 
            className="fixed inset-0 bg-black z-50 animate-slide-in"
          >
            <div className="w-full h-full flex flex-col">
              {/* Header - Fixed */}
              <div className="flex items-center justify-between p-4 bg-[hsl(214,35%,22%)] border-b border-gray-700 sticky top-0 z-10">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">
                    {selectedCard.playerName || 'Joueur Inconnu'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {selectedCard.teamName || 'Équipe Inconnue'}
                  </p>
                  <div className="flex gap-2 text-xs text-blue-400 mt-1">
                    {collections?.find(c => c.id === selectedCard.collectionId)?.name && (
                      <span>Collection: {collections.find(c => c.id === selectedCard.collectionId)?.name}</span>
                    )}
                    {selectedCard.season && <span>• Saison {selectedCard.season}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowOptionsPanel(true);
                    }}
                    className="text-white p-2 hover:bg-gray-700/30 rounded-lg transition-all z-20"
                    type="button"
                  >
                    <MoreVertical className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="text-white bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-all z-20"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content - Scrollable avec scroll fluide et hauteur augmentée */}
              <div className="flex-1 overflow-y-auto bg-[hsl(216,46%,13%)] p-8 pb-20" style={{ scrollBehavior: 'smooth' }}>
                {/* Card Container avec marges augmentées */}
                <div className="max-w-lg mx-auto min-h-full pb-20">
                  {/* Card Image avec effet 3D interactif */}
                  <div 
                    className="aspect-[3/4.5] bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 relative border border-blue-400 rounded-lg overflow-hidden mb-8 cursor-pointer"
                    style={{ perspective: '1000px' }}
                  >
                    {selectedCard.imageUrl ? (
                      <img 
                        ref={(el) => setCardRef(el)}
                        src={selectedCard.imageUrl} 
                        alt={selectedCard.playerName || "Card"}
                        className="w-full h-full object-cover select-none"
                        style={{
                          transformStyle: 'preserve-3d',
                          filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
                          willChange: 'transform'
                        }}
                        onMouseEnter={handleCardMouseEnter}
                        onMouseLeave={handleCardMouseLeave}
                        onMouseMove={handleCardMouseMove}
                        onMouseDown={handleCardMouseDown}
                        onMouseUp={handleCardMouseUp}
                        onTouchStart={handleCardMouseDown}
                        onTouchEnd={handleCardMouseUp}
                        onTouchMove={handleCardMouseMove}
                        onClick={() => {
                          setShowCardFullscreen(true);
                          setIsCardRotated(false);
                        }}
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-lg">#{selectedCard.reference}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Card Details - Structured two-column layout */}
                  <div className="space-y-6 text-white">
                    {/* Description Section */}
                    <div className="bg-[hsl(214,35%,18%)] rounded-xl p-6 border border-[hsl(214,35%,25%)]">
                      <h3 className="text-lg font-bold text-white mb-4">Description</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {selectedCard.saleDescription || selectedCard.tradeDescription || "Carte en excellent état, sortie directement du pack"}
                      </p>
                    </div>

                    {/* Information Section - Two columns */}
                    <div className="bg-[hsl(214,35%,18%)] rounded-xl p-6 border border-[hsl(214,35%,25%)]">
                      <h3 className="text-lg font-bold text-white mb-6">Informations</h3>
                      
                      <div className="space-y-4">
                        {/* Collection */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-gray-400 text-sm font-medium">Collection:</span>
                          <span className="col-span-2 text-white text-sm">
                            {collections?.find(c => c.id === selectedCard.collectionId)?.name || "Score Ligue 1"}
                          </span>
                        </div>

                        {/* Season */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-gray-400 text-sm font-medium">Saison:</span>
                          <span className="col-span-2 text-white text-sm">
                            {selectedCard.season || "23/24"}
                          </span>
                        </div>

                        {/* Card Type */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-gray-400 text-sm font-medium">Type de carte:</span>
                          <span className="col-span-2 text-white text-sm">
                            {(() => {
                              const type = selectedCard.cardType;
                              switch(type) {
                                case 'base': return 'Base';
                                case 'base_numbered': return 'Base Numérotée';
                                case 'insert': return 'Insert';
                                case 'autographe': return 'Autographe';
                                case 'numbered': return 'Numérotée';
                                case 'special_1_1': return 'Spéciale 1/1';
                                default: return type || 'Insert';
                              }
                            })()}
                          </span>
                        </div>

                        {/* Team */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-gray-400 text-sm font-medium">Équipe:</span>
                          <span className="col-span-2 text-white text-sm">
                            {selectedCard.teamName || "Équipe inconnue"}
                          </span>
                        </div>

                        {/* Player */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-gray-400 text-sm font-medium">Joueur:</span>
                          <span className="col-span-2 text-white text-sm">
                            {selectedCard.playerName || "Joueur inconnu"}
                          </span>
                        </div>

                        {/* Condition */}
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <span className="text-gray-400 text-sm font-medium">État:</span>
                          <span className="col-span-2 text-white text-sm">
                            {selectedCard.condition || "Near Mint"}
                          </span>
                        </div>

                        {/* Reference */}
                        {selectedCard.reference && (
                          <div className="grid grid-cols-3 gap-4 items-center">
                            <span className="text-gray-400 text-sm font-medium">Référence:</span>
                            <span className="col-span-2 text-white text-sm">
                              #{selectedCard.reference}
                            </span>
                          </div>
                        )}

                        {/* Numbering */}
                        {selectedCard.numbering && (
                          <div className="grid grid-cols-3 gap-4 items-center">
                            <span className="text-gray-400 text-sm font-medium">Numérotation:</span>
                            <span className="col-span-2 text-white text-sm">
                              {selectedCard.numbering}
                            </span>
                          </div>
                        )}

                        {/* Rarity */}
                        {selectedCard.rarity && (
                          <div className="grid grid-cols-3 gap-4 items-center">
                            <span className="text-gray-400 text-sm font-medium">Rareté:</span>
                            <span className="col-span-2 text-white text-sm">
                              {(() => {
                                const rarity = selectedCard.rarity;
                                switch(rarity) {
                                  case 'common': return 'Commune';
                                  case 'rare': return 'Rare';
                                  case 'super_rare': return 'Super Rare';
                                  case 'ultra_rare': return 'Ultra Rare';
                                  default: return rarity;
                                }
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Trade Info */}
                    {selectedCard.isForTrade && (
                      <div className="bg-[hsl(214,35%,15%)] rounded-lg p-4 space-y-2">
                        <div className="text-primary font-medium text-sm">
                          {selectedCard.tradeOnly ? "Échange uniquement" : "Vente & Échange"}
                        </div>
                        
                        {selectedCard.tradePrice && !selectedCard.tradeOnly && (
                          <div className="text-green-400 font-medium">
                            {selectedCard.tradePrice?.replace('$', '')}€
                          </div>
                        )}
                        
                        {selectedCard.tradeDescription && (
                          <div className="text-gray-300 text-sm">
                            {selectedCard.tradeDescription}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Options Panel - Slide from bottom */}
            {showOptionsPanel && (
              <>
                <div 
                  className="fixed inset-0 bg-black/50 z-[70]"
                  onClick={() => setShowOptionsPanel(false)}
                />
                <div className="fixed bottom-0 left-0 right-0 bg-[hsl(214,35%,22%)] rounded-t-3xl z-[80] transform transition-transform duration-300 ease-out">
                  <div className="p-6 space-y-4">
                    {/* Handle bar */}
                    <div className="w-12 h-1 bg-gray-500 rounded-full mx-auto mb-4" />
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1" />
                      <h3 className="text-lg font-bold text-white text-center">Actions</h3>
                      <div className="flex-1 flex justify-end">
                        <button
                          onClick={() => setShowOptionsPanel(false)}
                          className="text-white hover:bg-gray-600/30 rounded-lg p-1 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* 1. Mettre en vente */}
                    {!selectedCard.isSold && (
                      (selectedCard.isForSale || selectedCard.isForTrade) ? (
                        <button 
                          onClick={handleRemoveFromSale}
                          className="w-full p-1.5 text-white hover:bg-red-400/10 rounded-lg text-sm transition-colors text-left flex items-center gap-2"
                        >
                          <X className="w-3.5 h-3.5 text-[hsl(9,85%,67%)]" />
                          Retirer de la vente
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setShowOptionsPanel(false);
                            setShowTradePanel(true);
                          }}
                          className="w-full p-1.5 text-white hover:bg-green-400/10 rounded-lg text-sm transition-colors text-left flex items-center gap-2"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-[hsl(9,85%,67%)]" />
                          Mettre en vente
                        </button>
                      )
                    )}

                    {/* 2. Marquer comme vendue */}
                    {!selectedCard.isSold && (
                      <button 
                        onClick={handleMarkAsSold}
                        className="w-full p-1.5 text-white hover:bg-green-400/10 rounded-lg text-sm transition-colors text-left flex items-center gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-[hsl(9,85%,67%)]" />
                        Marquer comme vendue
                      </button>
                    )}
                    
                    {/* 3. Poster à la une */}
                    <button 
                      onClick={() => {
                        setShowOptionsPanel(false);
                        setShowFeaturedPanel(true);
                      }}
                      className="w-full p-1.5 text-white hover:bg-yellow-400/10 rounded-lg text-sm transition-colors text-left flex items-center gap-2"
                    >
                      <Star className="w-3.5 h-3.5 text-[hsl(9,85%,67%)]" />
                      Poster à la une
                    </button>
                    
                    {/* 4. Ajouter à la collection */}
                    <button 
                      onClick={() => setShowOptionsPanel(false)}
                      className="w-full p-1.5 text-white hover:bg-blue-400/10 rounded-lg text-sm transition-colors text-left flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5 text-[hsl(9,85%,67%)]" />
                      Ajouter à la collection
                    </button>
                    
                    {/* 5. Modifier la carte */}
                    <button 
                      onClick={() => handleEditCard(selectedCard)}
                      className="w-full p-1.5 text-white hover:bg-blue-400/10 rounded-lg text-sm transition-colors text-left flex items-center gap-2"
                    >
                      <Edit className="w-3.5 h-3.5 text-[hsl(9,85%,67%)]" />
                      Modifier la carte
                    </button>
                    
                    {/* 6. Dupliquer la carte */}
                    <button 
                      onClick={() => handleDuplicateCard(selectedCard)}
                      className="w-full p-1.5 text-white hover:bg-purple-400/10 rounded-lg text-sm transition-colors text-left flex items-center gap-2"
                    >
                      <Copy className="w-3.5 h-3.5 text-[hsl(9,85%,67%)]" />
                      Dupliquer la carte
                    </button>

                    {selectedCard.isSold && (
                      <div className="w-full p-1.5 text-gray-400 rounded-lg text-sm text-center">
                        <div className="text-yellow-400 font-bold mb-1">✓ Carte vendue</div>
                        <div className="text-xs">Aucune action disponible</div>
                      </div>
                    )}
                    
                    {/* Séparateur */}
                    <div className="border-t border-gray-600/30 my-2"></div>
                    
                    {/* 7. Supprimer la carte */}
                    <button 
                      onClick={() => handleDeleteCard(selectedCard)}
                      className="w-full p-1.5 text-white hover:bg-red-600/10 rounded-lg text-sm transition-colors text-left flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[hsl(9,85%,67%)]" />
                      Supprimer la carte
                    </button>
                    
                    <button 
                      onClick={() => setShowOptionsPanel(false)}
                      className="w-full p-4 text-gray-400 hover:bg-gray-400/10 rounded-lg font-medium transition-colors text-center mt-6"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Featured Panel */}
            {showFeaturedPanel && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
                <div className="bg-[hsl(214,35%,22%)] rounded-2xl w-full max-w-md border border-[hsl(214,35%,30%)]">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">À la une</h3>
                      <button
                        onClick={() => setShowFeaturedPanel(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description du post
                        </label>
                        <textarea
                          value={featuredDescription}
                          onChange={(e) => setFeaturedDescription(e.target.value)}
                          placeholder="Partagez quelque chose sur cette carte..."
                          className="w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowFeaturedPanel(false)}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={async () => {
                            if (!featuredDescription.trim() || !selectedCard) return;
                            
                            try {
                              const response = await fetch('/api/posts', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  content: featuredDescription,
                                  cardImage: selectedCard.imageUrl,
                                  cardName: selectedCard.playerName,
                                  type: 'featured'
                                })
                              });
                              
                              if (!response.ok) {
                                throw new Error('Failed to create post');
                              }
                              
                              setShowFeaturedPanel(false);
                              setFeaturedDescription("");
                              setSelectedCard(null);
                              
                              toast({
                                title: "Post créé !",
                                description: "Ton post a été ajouté à la une.",
                                className: "bg-green-600 border-green-600 text-white",
                              });
                            } catch (error) {
                              toast({
                                title: "Erreur",
                                description: "Impossible de créer le post.",
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={!featuredDescription.trim()}
                          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                        >
                          Publier
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Window */}
            {showEditModal && (
              <div className="fixed inset-0 bg-[hsl(216,46%,13%)] z-[100]">
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="w-8"></div> {/* Spacer pour centrer le titre */}
                    
                    <h1 className="text-xl font-bold text-white">Modifier la carte</h1>
                    
                    <div className="flex items-center space-x-2">
                      {/* Bouton de validation */}
                      <button
                        onClick={handleSaveEdit}
                        className="p-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                        title="Valider les modifications"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </button>
                    
                      {/* Bouton de fermeture à droite */}
                      <button
                        onClick={() => {
                          setShowEditModal(false);
                          setShowPlayerSuggestions(false);
                          setShowTeamSuggestions(false);
                        }}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Fermer"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6 pb-24">
                    <div className="max-w-2xl mx-auto space-y-4">
                    
                      {/* Image upload section */}
                      <div className="space-y-4">
                        {/* Current image preview with overlay icon */}
                        {editImagePreview && (
                          <div className="w-48 h-60 mx-auto mb-4 rounded-lg overflow-hidden relative">
                            <img 
                              src={editImagePreview} 
                              alt="Aperçu" 
                              className="w-full h-full object-cover"
                            />
                            {/* Bouton de changement d'image */}
                            <label className="absolute top-2 left-2 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white p-2 rounded-lg transition-colors shadow-lg cursor-pointer" title="Changer l'image">
                              <Camera className="w-4 h-4" />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleEditImageUpload}
                              />
                            </label>
                            {/* Bouton de retouche */}
                            <button
                              onClick={() => openImageEditor(editImagePreview)}
                              className="absolute top-2 right-2 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white p-2 rounded-lg transition-colors shadow-lg"
                              title="Retoucher l'image"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        
                        {/* File upload initial (si pas d'image) */}
                        {!editImagePreview && (
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-[hsl(214,35%,25%)] hover:bg-[hsl(214,35%,30%)] transition-colors">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Camera className="w-10 h-10 mb-4 text-gray-400" />
                                <p className="mb-2 text-base text-gray-400">
                                  <span className="font-semibold">Cliquer pour uploader</span> ou glisser-déposer
                                </p>
                                <p className="text-sm text-gray-500">PNG, JPG ou JPEG</p>
                              </div>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleEditImageUpload}
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Collection selector */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Collection
                          </label>
                          <select
                            value={editData.collectionId}
                            onChange={(e) => setEditData({...editData, collectionId: e.target.value})}
                            className="w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)] text-base"
                          >
                            <option value="">Sélectionner une collection</option>
                            {collections?.map((collection) => (
                              <option key={collection.id} value={collection.id}>
                                {collection.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Season selector */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Saison
                          </label>
                          <select
                            value={editData.season}
                            onChange={(e) => setEditData({...editData, season: e.target.value})}
                            className="w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)] text-base"
                          >
                            <option value="">Sélectionner une saison</option>
                            <option value="22/23">2022/23</option>
                            <option value="23/24">2023/24</option>
                            <option value="24/25">2024/25</option>
                          </select>
                        </div>
                      </div>

                      {/* Card details section */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Nom du joueur avec autocomplétion */}
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Nom du joueur
                            </label>
                            <input
                              type="text"
                              value={editData.playerName}
                              onChange={(e) => handlePlayerNameChange(e.target.value)}
                              onFocus={() => editData.playerName.length > 2 && setShowPlayerSuggestions(true)}
                              className="w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)] text-base"
                            />
                            {showPlayerSuggestions && playerSuggestions.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg shadow-lg max-h-32 overflow-y-auto">
                                {playerSuggestions.map((suggestion, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      setEditData({...editData, playerName: suggestion});
                                      setShowPlayerSuggestions(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-white hover:bg-[hsl(214,35%,40%)] transition-colors"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Équipe avec autocomplétion */}
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Équipe
                            </label>
                            <input
                              type="text"
                              value={editData.teamName}
                              onChange={(e) => handleTeamNameChange(e.target.value)}
                              onFocus={() => editData.teamName.length > 2 && setShowTeamSuggestions(true)}
                              className="w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)] text-base"
                            />
                            {showTeamSuggestions && teamSuggestions.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg shadow-lg max-h-32 overflow-y-auto">
                                {teamSuggestions.map((suggestion, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      setEditData({...editData, teamName: suggestion});
                                      setShowTeamSuggestions(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-white hover:bg-[hsl(214,35%,40%)] transition-colors"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Type de carte
                            </label>
                            <input
                              type="text"
                              value={editData.cardType}
                              onChange={(e) => setEditData({...editData, cardType: e.target.value})}
                              className="w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)] text-base"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Référence
                            </label>
                            <input
                              type="text"
                              value={editData.reference}
                              onChange={(e) => setEditData({...editData, reference: e.target.value})}
                              className="w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)] text-base"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Numérotation
                            </label>
                            <input
                              type="text"
                              value={editData.numbering}
                              onChange={(e) => setEditData({...editData, numbering: e.target.value})}
                              className="w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)] text-base"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Qualité
                            </label>
                            <select
                              value={editData.condition}
                              onChange={(e) => setEditData({...editData, condition: e.target.value})}
                              className="w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)] text-base"
                            >
                              <option value="mint">Mint</option>
                              <option value="excellent">Excellent</option>
                              <option value="good">Bon</option>
                              <option value="poor">Mauvais</option>
                            </select>
                          </div>
                        </div>
                        

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trade Panel */}
            {showTradePanel && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
                <div className="bg-[hsl(214,35%,22%)] rounded-2xl w-full max-w-md border border-[hsl(214,35%,30%)]">
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Paramètres de vente</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Prix de vente
                        </label>
                        <input
                          type="text"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          placeholder="Ex: 15€"
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={saleDescription}
                          onChange={(e) => setSaleDescription(e.target.value)}
                          placeholder="Décrivez l'état de la carte..."
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[hsl(9,85%,67%)] resize-none"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="tradeOnly"
                          checked={tradeOnly}
                          onChange={(e) => setTradeOnly(e.target.checked)}
                          className="w-4 h-4 text-[hsl(9,85%,67%)] bg-gray-700 border-gray-600 rounded focus:ring-[hsl(9,85%,67%)]"
                        />
                        <label htmlFor="tradeOnly" className="text-sm text-gray-300">
                          Échange uniquement (pas de vente)
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button 
                        onClick={() => setShowTradePanel(false)}
                        className="flex-1 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Annuler
                      </button>
                      <button 
                        onClick={handleSaveSaleSettings}
                        className="flex-1 p-3 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] text-white rounded-lg font-medium transition-colors"
                      >
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      

      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && collectionToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[hsl(214,35%,22%)] rounded-2xl p-6 max-w-md w-full mx-4 border border-[hsl(214,35%,30%)]">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-white text-center mb-2">
              Supprimer la collection
            </h3>
            
            <p className="text-[hsl(212,23%,69%)] text-center mb-6">
              Es-tu sûr de vouloir supprimer la collection "{collectionToDelete.name}" ? 
              Cette action est irréversible et supprimera toutes les cartes associées.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCollectionToDelete(null);
                }}
                className="flex-1 px-4 py-2 text-sm bg-[hsl(214,35%,30%)] text-white rounded-lg hover:bg-[hsl(214,35%,35%)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteCollection}
                disabled={deleteCollectionMutation.isPending}
                className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteCollectionMutation.isPending ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression de carte */}
      {showDeleteCardModal && cardToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">Supprimer la carte</h3>
                <p className="text-gray-400 text-sm">Cette action est irréversible</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 text-sm">
                Êtes-vous sûr de vouloir supprimer définitivement cette carte ?
              </p>
              <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                <p className="text-white font-medium text-sm">{cardToDelete.playerName}</p>
                <p className="text-gray-400 text-xs">{cardToDelete.reference}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteCardModal(false);
                  setCardToDelete(null);
                }}
                className="flex-1 px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteCard}
                disabled={deleteCardMutation.isPending}
                className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteCardMutation.isPending ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Fullscreen Modal */}
      {showCardFullscreen && selectedCard && selectedCard.imageUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4"
          onClick={() => {
            setShowCardFullscreen(false);
            setIsCardRotated(false);
          }}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowCardFullscreen(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Card Image */}
            <div 
              className="max-w-full max-h-full flex items-center justify-center cursor-pointer select-none"
              style={{ 
                perspective: '1200px',
                transformStyle: 'preserve-3d'
              }}
              onMouseMove={(e) => {
                if (!isCardRotated) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const centerX = rect.left + rect.width / 2;
                  const centerY = rect.top + rect.height / 2;
                  
                  // Normaliser les coordonnées entre -1 et 1
                  const normalizedX = (e.clientX - centerX) / (rect.width / 2);
                  const normalizedY = (e.clientY - centerY) / (rect.height / 2);
                  
                  // Limiter et ajuster la rotation pour un effet plus naturel
                  const maxRotation = 25;
                  const rotateY = normalizedX * maxRotation;
                  const rotateX = -normalizedY * maxRotation;
                  
                  setRotationStyle({ 
                    rotateX: Math.max(-maxRotation, Math.min(maxRotation, rotateX)), 
                    rotateY: Math.max(-maxRotation, Math.min(maxRotation, rotateY))
                  });
                }
              }}
              onMouseLeave={() => {
                if (!isCardRotated) {
                  setRotationStyle({ rotateX: 0, rotateY: 0 });
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsCardRotated(!isCardRotated);
                if (!isCardRotated) {
                  // Rotation fixe quand cliqué
                  setRotationStyle({ rotateX: 15, rotateY: 35 });
                } else {
                  // Retour à la position neutre
                  setRotationStyle({ rotateX: 0, rotateY: 0 });
                }
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setIsCardRotated(!isCardRotated);
                if (!isCardRotated) {
                  setRotationStyle({ rotateX: 15, rotateY: 35 });
                } else {
                  setRotationStyle({ rotateX: 0, rotateY: 0 });
                }
              }}
              onTouchMove={(e) => {
                if (!isCardRotated && e.touches.length === 1) {
                  const touch = e.touches[0];
                  const rect = e.currentTarget.getBoundingClientRect();
                  const centerX = rect.left + rect.width / 2;
                  const centerY = rect.top + rect.height / 2;
                  
                  const normalizedX = (touch.clientX - centerX) / (rect.width / 2);
                  const normalizedY = (touch.clientY - centerY) / (rect.height / 2);
                  
                  const maxRotation = 20; // Un peu moins que sur desktop pour mobile
                  const rotateY = normalizedX * maxRotation;
                  const rotateX = -normalizedY * maxRotation;
                  
                  setRotationStyle({ 
                    rotateX: Math.max(-maxRotation, Math.min(maxRotation, rotateX)), 
                    rotateY: Math.max(-maxRotation, Math.min(maxRotation, rotateY))
                  });
                }
              }}
              onTouchEnd={() => {
                if (!isCardRotated) {
                  setRotationStyle({ rotateX: 0, rotateY: 0 });
                }
              }}
            >
              <img
                src={selectedCard.imageUrl}
                alt={selectedCard.playerName || "Card"}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 25px 50px rgba(255,255,255,0.1))',
                  transform: `perspective(1200px) rotateX(${rotationStyle.rotateX}deg) rotateY(${rotationStyle.rotateY}deg) scale(${isCardRotated ? 1.05 : 1})`,
                  transformStyle: 'preserve-3d',
                  transition: isCardRotated 
                    ? 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
                    : 'transform 0.15s ease-out',
                  background: `linear-gradient(
                    ${45 + rotationStyle.rotateY}deg, 
                    rgba(255,255,255,0.1) 0%, 
                    rgba(255,255,255,0.05) 50%, 
                    rgba(0,0,0,0.1) 100%
                  )`,
                  boxShadow: `
                    0 0 0 8px rgba(255,215,0,0.3),
                    0 0 0 16px rgba(255,215,0,0.1),
                    ${20 + rotationStyle.rotateY / 2}px ${20 + rotationStyle.rotateX / 2}px 60px rgba(0,0,0,0.8),
                    inset -5px -5px 15px rgba(0,0,0,0.3),
                    inset 5px 5px 15px rgba(255,255,255,${0.1 + Math.abs(rotationStyle.rotateX) / 100})
                  `,
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none'
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Menu */}
      {showImageEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[200]">
          <div className="h-full bg-[hsl(216,46%,13%)] flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Retouche d'image</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      applyImageEdits();
                      setShowImageEditor(false);
                    }}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setShowImageEditor(false)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Image Preview - Slightly larger and centered */}
            <div className="flex justify-center p-4 border-b border-gray-700">
              <div className={`w-40 h-52 overflow-hidden rounded-lg ${imageEditorActiveTab === 'crop' ? 'border-2 border-dashed border-[hsl(9,85%,67%)] bg-gray-800/50' : ''}`}>
                <img
                  src={editedImageResult}
                  alt="Aperçu retouché"
                  className="w-full h-full object-cover shadow-lg"
                  style={{
                    filter: `brightness(${imageEditorBrightness}%) contrast(${imageEditorContrast}%)`,
                    transform: `rotate(${imageEditorRotation}deg) scale(${imageEditorZoom / 100}) translate(${imageEditorPosition.x}px, ${imageEditorPosition.y}px)`,
                    transformOrigin: 'center center'
                  }}
                />
              </div>
            </div>

            {/* Controls Area - Taking most of the screen */}
            <div className="flex-1 overflow-y-auto">
              {/* Horizontal Menu Tabs with integrated gauge */}
              <div className="border-b border-gray-700">
                <div className="flex overflow-x-auto scrollbar-hide px-4">
                  {[
                    { id: 'brightness', label: 'Luminosité', icon: Star },
                    { id: 'contrast', label: 'Contraste', icon: Zap },
                    { id: 'rotation', label: 'Rotation', icon: RefreshCw },
                    { id: 'crop', label: 'Rogner', icon: Crop }
                  ].map((tab) => (
                    <div key={tab.id} className="relative">
                      <button
                        onClick={() => setImageEditorActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap border-b-2 transition-colors ${
                          imageEditorActiveTab === tab.id
                            ? 'border-[hsl(9,85%,67%)] text-white'
                            : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                      {/* Gauge integrated in tab */}
                      {imageEditorActiveTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-600">
                          <div 
                            className="h-0.5 bg-[hsl(9,85%,67%)] transition-all duration-300"
                            style={{ 
                              width: tab.id === 'brightness' ? `${(imageEditorBrightness - 50) / 100 * 100}%` :
                                     tab.id === 'contrast' ? `${(imageEditorContrast - 50) / 100 * 100}%` :
                                     tab.id === 'rotation' ? `${(imageEditorRotation % 360) / 360 * 100}%` :
                                     '50%'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls Content */}
              <div className="p-6">
                {/* Tab Content */}
                {imageEditorActiveTab === 'brightness' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-white font-medium text-lg">Luminosité</label>
                      <span className="text-gray-400 text-lg">{imageEditorBrightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={imageEditorBrightness}
                      onChange={(e) => setImageEditorBrightness(parseInt(e.target.value))}
                      className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                )}

                {imageEditorActiveTab === 'contrast' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-white font-medium text-lg">Contraste</label>
                      <span className="text-gray-400 text-lg">{imageEditorContrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={imageEditorContrast}
                      onChange={(e) => setImageEditorContrast(parseInt(e.target.value))}
                      className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                )}

                {imageEditorActiveTab === 'rotation' && (
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <button
                        onClick={() => rotateImage('left')}
                        className="flex-1 bg-[hsl(214,35%,30%)] hover:bg-[hsl(214,35%,35%)] text-white py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-sm"
                      >
                        <RefreshCw className="w-4 h-4 rotate-180" />
                        90° Gauche
                      </button>
                      <button
                        onClick={() => rotateImage('right')}
                        className="flex-1 bg-[hsl(214,35%,30%)] hover:bg-[hsl(214,35%,35%)] text-white py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        90° Droite
                      </button>
                    </div>
                    <div className="text-center text-gray-400 text-lg">
                      Rotation actuelle: {imageEditorRotation}°
                    </div>
                  </div>
                )}

                {imageEditorActiveTab === 'crop' && (
                  <div className="space-y-6">
                    <p className="text-gray-400 text-sm mb-4">Ajustez le zoom et la position :</p>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-400 text-base mb-3">Position X: {imageEditorPosition.x}px</label>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={imageEditorPosition.x}
                          onChange={(e) => setImageEditorPosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                          className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-base mb-3">Position Y: {imageEditorPosition.y}px</label>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={imageEditorPosition.y}
                          onChange={(e) => setImageEditorPosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                          className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-base mb-3">Zoom: {imageEditorZoom}%</label>
                        <input
                          type="range"
                          min="80"
                          max="200"
                          value={imageEditorZoom}
                          onChange={(e) => setImageEditorZoom(parseInt(e.target.value))}
                          className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Celebration Modal */}
      <MilestoneCelebration 
        milestone={currentMilestone}
        onClose={() => setCurrentMilestone(null)}
      />

      {/* Development Test Button - Hidden in production */}

      {/* Floating Add Card Button - Only in "Mes cartes" tab and when no fullscreen modal */}
      {activeTab === "cards" && !showCardFullscreen && (
        <button
          onClick={() => setLocation("/add-card")}
          className="fixed bottom-20 right-4 w-10 h-10 bg-[hsl(9,85%,67%)] hover:bg-[hsl(9,85%,60%)] active:bg-[hsl(9,85%,55%)] text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110 active:scale-95"
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(240, 101, 67, 0.25), 0 0 0 0 rgba(240, 101, 67, 0.3)',
          }}
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {/* Modal de création de check-lists */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(214,35%,22%)] rounded-2xl p-6 max-w-md w-full border border-[hsl(214,35%,30%)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Créer une nouvelle check-list</h3>
              <button
                onClick={() => setShowChecklistModal(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Sélecteur de marque */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Marque
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setSelectedChecklistCollection(''); // Reset collection quand marque change
                  }}
                  className="w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)]"
                >
                  <option value="">Sélectionner une marque</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélecteur de collection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Collection
                </label>
                <select
                  value={selectedChecklistCollection}
                  onChange={(e) => {
                    setSelectedChecklistCollection(e.target.value);
                    setSelectedYear(''); // Reset année quand collection change
                  }}
                  disabled={!selectedBrand}
                  className="w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)] disabled:opacity-50"
                >
                  <option value="">Sélectionner une collection</option>
                  {selectedBrand && collectionsByBrand[selectedBrand]?.map((collection) => (
                    <option key={collection} value={collection}>
                      {collection}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélecteur d'année */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Année
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  disabled={!selectedChecklistCollection}
                  className="w-full bg-[hsl(214,35%,30%)] border border-[hsl(214,35%,40%)] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[hsl(9,85%,67%)] disabled:opacity-50"
                >
                  <option value="">Sélectionner une année</option>
                  {selectedChecklistCollection && getAvailableYears(selectedChecklistCollection).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 pt-6">
              <button
                onClick={() => setShowChecklistModal(false)}
                className="flex-1 px-4 py-2 text-sm bg-[hsl(214,35%,30%)] text-white rounded-lg hover:bg-[hsl(214,35%,35%)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateChecklist}
                disabled={!selectedBrand || !selectedChecklistCollection || !selectedYear}
                className="flex-1 px-4 py-2 text-sm bg-[hsl(9,85%,67%)] text-white rounded-lg hover:bg-[hsl(9,85%,60%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
}