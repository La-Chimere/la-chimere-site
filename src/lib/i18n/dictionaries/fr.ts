// Dictionnaire français — langue par défaut du club (CDC section 14.4).
const fr: Record<string, string> = {
  // Commun
  "common.close": "Fermer",
  "common.sure": "Sûr ?",
  "common.hide": "Masquer",
  "common.create": "Créer",
  "common.cancel": "Annuler",
  "common.confirm": "Confirmer",
  "common.save": "Enregistrer",
  "common.edit": "Modifier",
  "common.delete": "Supprimer",
  "common.remove": "Retirer",
  "common.add": "Ajouter",
  "common.back": "Retour",
  "common.next": "Suivant",
  "common.yes": "Oui",
  "common.no": "Non",
  "common.optional": "Facultatif",
  "common.previous": "Précédent",
  "common.all": "Tous",

  // Dates
  "date.mon": "Lun",
  "date.tue": "Mar",
  "date.wed": "Mer",
  "date.thu": "Jeu",
  "date.fri": "Ven",
  "date.sat": "Sam",
  "date.sun": "Dim",
  "date.today": "aujourd'hui",
  "date.yesterday": "hier",
  "activity.today": "Dernière partie aujourd'hui",
  "activity.yesterday": "Dernière partie hier",
  "activity.daysAgo": "Dernière partie il y a {n} jours",
  "activity.none": "Aucune activité récente",

  // Programme (CDC 4.2/12.10)
  "programme.calendarView": "Vue calendrier",
  "programme.nothingPlanned": "Rien de prévu.",

  // Évènements (CDC 12.3/12.4)
  "event.genericEvent": "Évènement",
  "event.defaultTitle": "Partie",
  "event.noParticipant": "Aucun participant",
  "event.contact": "Contacter",
  "event.joined": "Rejoint ✓",
  "event.join": "Rejoindre",
  "event.leave": "Se désinscrire",
  "event.indicatedBy": "Indiqué par",
  "event.member": "Membre",
  "event.participants": "Participants",
  "event.result.win": "V",
  "event.result.tie": "E",
  "event.result.loss": "D",
  "event.transformToEvent": "Transformer en évènement",
  "event.form.titleAvailability": "Indiquer ma disponibilité",
  "event.form.titleEvent": "Nouvelle partie",
  "event.form.date": "Date",
  "event.form.time": "Heure",
  "event.form.repeatsWeekly": "Se répète toutes les semaines",
  "event.form.tag": "Étiquette",
  "event.form.title": "Titre",
  "event.form.titlePlaceholder": "Titre de la partie",
  "event.form.participants": "Participants",
  "event.form.description": "Description",
  "event.form.creating": "Création…",

  // Disponibilités (CDC 12.12)
  "availability.menuButton": "Dispos",
  "availability.hide": "Masquer",
  "availability.show": "Afficher",
  "availability.indicate": "Indiquer ma dispo",
  "availability.deleteMine": "Supprimer mes dispos",
  "availability.deleteConfirmTitle": "Supprimer mes disponibilités",
  "availability.deleteConfirmBody":
    "Toutes les disponibilités que vous avez indiquées vont être supprimées du calendrier.",

  // Communautés (CDC 12.8)
  "communities.upcomingEvents": "Évènements à venir",
  "communities.nothingUpcoming": "Rien de prévu pour l'instant.",
  "communities.members": "Membres",
  "communities.noMembers": "Aucun membre dans cette sélection.",

  // Classement (CDC 4.4/12.7)
  "leaderboard.title": "Classement",
  "leaderboard.membersThisWeek": "membres passés au local cette semaine",
  "leaderboard.eventsThisWeek": "parties ou évènements cette semaine",
  "leaderboard.gamesPlayedLine1": "Parties",
  "leaderboard.gamesPlayedLine2": "jouées",
  "leaderboard.wtl": "V / E / D",
  "leaderboard.noGames": "Aucune partie enregistrée pour l'instant.",

  // Admin (CDC 12.9)
  "admin.members.title": "Membres",
  "admin.members.activeThisMonth": "actifs ce mois-ci",
  "admin.members.total": "membres au total",
  "admin.members.pending": "En attente de validation",
  "admin.members.validate": "Valider",
  "admin.members.deleteConfirmTitle": "Supprimer ce membre ?",
  "admin.members.deleteConfirmBody":
    "Attention, toutes les informations de ce membre seront supprimées et il ne pourra plus accéder à l'app.",
  "admin.keys.title": "Clés",
  "admin.keys.buildingCode": "Code d'entrée de l'immeuble",
  "admin.keys.editTotal": "Modifier le nombre de clés",
  "admin.keys.maxReached": "Nombre maximal de clés déjà atteint.",
  "admin.keys.exitKeys": "Clés de sortie ({current} / {total})",
  "admin.keys.noExitKeyHolders": "Personne n'a actuellement emprunté de clé de sortie.",
  "admin.communities.title": "Communautés",
  "admin.communities.add": "Ajouter une communauté",
  "admin.communities.editTitle": "Modifier la communauté",
  "admin.communities.name": "Nom de la communauté",
  "admin.communities.competitiveToggle": "Volet compétitif",
  "admin.communities.hidden": "Communauté masquée",
  "admin.communities.visible": "Communauté visible",
  "admin.error.maxKeysReached": "Nombre maximal de clés déjà atteint.",
  "admin.error.totalBelowHolders":
    "Le nouveau total ne peut pas être inférieur au nombre de porteurs actuels.",

  // Sélecteur de membre (CDC 12.3/12.9)
  "memberPicker.searchPlaceholder": "Rechercher un membre…",
  "memberPicker.remove": "Retirer {name}",
  "memberPicker.noResults": "Aucun membre trouvé.",

  // Nav (CDC 12.2)
  "nav.programme": "Programme",
  "nav.leaderboard": "Leaderboard",
  "nav.communities": "Communautés",
  "nav.admin": "Admin",

  // Connexion / inscription (CDC 4.1/13)
  "login.welcomeLine1": "Bienvenue au Club",
  "login.welcomeLine2": "La Chimère !",
  "login.createAccount": "Créer mon compte",
  "login.logIn": "Me connecter",
  "login.nickname": "Pseudo",
  "login.nicknamePlaceholder": "Ton pseudo",
  "login.password": "Mot de passe",
  "login.loggingIn": "Connexion…",
  "auth.error.missingCredentials": "Pseudo et mot de passe requis.",
  "auth.error.invalidCredentials": "Identifiants incorrects.",
  "auth.error.invalidNickname": "Pseudo invalide.",
  "auth.error.nicknameTaken": "Ce pseudo est déjà pris.",
  "auth.error.createAccountFailed": "Impossible de créer le compte :",
  "auth.error.createAccountRetry": "Impossible de créer le compte, réessaie.",
  "auth.error.createProfileFailed": "Impossible de créer le profil :",

  // Assistant d'inscription (CDC 13.2-13.5)
  "signup.step": "Étape {current} / {total}",
  "signup.step1.title": "Qui es-tu ?",
  "signup.step1.nickname": "Prénom ou pseudo",
  "signup.step1.nicknamePlaceholder": "Ex : Louis-Marie",
  "signup.step1.email": "Mail",
  "signup.step1.visible": "Visible",
  "signup.step1.phone": "Téléphone",
  "signup.step1.location": "Localisation",
  "signup.step1.locationPlaceholder": "Ex : Plainpalais à 15 min du local",
  "signup.step1.locationNote":
    "Ces informations restent visibles uniquement par toi et l'administrateur technique, sauf si tu choisis de les partager (voir étape 3 pour la gestion de tes données).",
  "signup.step1.password": "Mot de passe",
  "signup.step1.confirmPassword": "Confirmer le mot de passe",
  "signup.step1.passwordMismatch": "Les mots de passe ne correspondent pas.",
  "signup.step1.consent":
    "L'appartenance au Club La Chimère inclut <strong>une participation financière mensuelle</strong> et d'avoir <strong>rencontré au moins un des membres du comité</strong>. Je confirme en avoir connaissance et m'en être acquitté.",
  "signup.step2.title": "Bienvenue ! À quoi tu joues ?",
  "signup.step2.subtitle": "Sélectionne tes communautés ! Tu pourras modifier ça quand tu veux.",
  "signup.step2.joinedYear": "T'es depuis combien de temps au club ?",
  "signup.step2.bio": "Tu veux te présenter ?",
  "signup.step2.bioPlaceholder": "Dire quel jeu tu préfères ? Quelle armée tu joues ? Éclate-toi !",
  "signup.step2.bioNote": "Tu pourras ajouter une photo de profil juste après, depuis Mon profil.",
  "signup.step3.title": "Bon à savoir",
  "signup.step3.rulesTitle": "Règlement du club",
  "signup.step3.rulesPlaceholder": "Le texte complet du règlement sera ajouté avant la mise en production.",
  "signup.step3.termsTitle": "Conditions générales d'utilisation",
  "signup.step3.termsPlaceholder": "Le texte complet des CGU sera ajouté avant la mise en production.",
  "signup.step3.consent":
    "J'atteste avoir lu et accepté le règlement du club et les conditions générales d'utilisation.",
  "signup.step3.join": "Rejoindre",
  "signup.step3.joining": "Création…",
  "signup.success.title": "Bienvenue au Club !",
  "signup.success.cta": "Accéder à l'app",

  // Annonces (CDC 12.5)
  "announcements.title": "Annonces",
  "announcements.markAllSeen": "Tout marquer comme vu",
  "announcements.none": "Aucune annonce.",
  "announcements.markUnread": "Marquer non lu",
  "announcements.markRead": "Marquer lu",

  // Notifications (CDC 12.6)
  "notifications.title": "Notifications",
  "notifications.markAllRead": "Tout marquer comme lu",
  "notifications.none": "Aucune notification.",

  // Sondage
  "poll.vote": "Voter",
  "poll.viewResults": "Voir les résultats",

  // Formulaire d'annonce
  "announcementForm.editTitle": "Modifier l'annonce",
  "announcementForm.newTitle": "Nouvelle annonce",
  "announcementForm.titleLabel": "Titre",
  "announcementForm.for": "Pour",
  "announcementForm.description": "Description",
  "announcementForm.showInBanner": "Afficher dans le bandeau d'alerte ?",
  "announcementForm.bannerText": "Texte du bandeau",
  "announcementForm.createPoll": "Créer un sondage",
  "announcementForm.pollQuestion": "Question du sondage",
  "announcementForm.option": "Option",
  "announcementForm.addOption": "Ajouter une option",
  "announcementForm.publish": "Publier",
  "announcementForm.pollType.unique": "Réponse unique",
  "announcementForm.pollType.multiple": "Réponse multiple",
  "announcementForm.pollType.rating": "Évaluation",
  "announcements.error.createFailed": "Impossible de créer l'annonce.",

  // Profil
  "profile.bio": "Présentation",
  "profile.myCommunities": "Mes communautés",
  "profile.changePassword": "Changer le mot de passe",
  "profile.currentPassword": "Mot de passe actuel",
  "profile.newPassword": "Nouveau mot de passe",
  "profile.confirmNewPassword": "Confirmer le nouveau mot de passe",
  "profile.saved": "Modifications enregistrées ✓",
  "profile.saveChanges": "Enregistrer les modifications",
  "profile.avatar.uploading": "Envoi…",
  "profile.avatar.change": "Changer la photo",
  "profile.error.cannotVerifyPassword": "Impossible de vérifier le mot de passe actuel.",
  "profile.error.wrongCurrentPassword": "Mot de passe actuel incorrect.",

  // Clés
  "keys.buildingCode": "Code d'entrée de l'immeuble.",
  "keys.iHaveKey": "Tu es porteur d'une clé du local.",
  "keys.giveMyKeys": "Donner mes clés",
  "keys.iLostMyKeys": "J'ai perdu mes clés",
  "keys.currentlyBorrowed":
    "Tu as actuellement emprunté les clés pour sortir — pense à les rapporter avant ta prochaine sortie du local.",
  "keys.iDontHaveKey": "Tu n'es pas porteur de clé.",
  "keys.iBorrowedExitKeys": "J'ai emprunté les clés pour sortir",
  "keys.giveToAnotherMember": "Donner mes clés à un autre membre",
  "keys.confirmTransfer": "Confirmer le transfert",
  "keys.lostKeyNote": "Ton statut de porteur de clé sera retiré immédiatement et le comité sera prévenu.",
  "keys.aMember": "Un membre",
  "keys.error.noKeyToGive": "Tu ne possèdes pas de clé à transmettre.",
  "keys.error.memberNotFound": "Membre introuvable.",
  "keys.error.allExitKeysBorrowed": "Toutes les clés de sortie sont déjà empruntées.",
  "keys.notif.receivedKey": "{name} t'a transmis sa clé du local.",
  "keys.notif.transferredKey": "{from} a transmis sa clé à {to}.",
  "keys.notif.lostKey": "{name} a perdu sa clé du local.",
  "keys.notif.borrowedExitKeys": "{name} a emprunté les clés pour sortir.",
  "keys.notif.returnReminder": "N'oublie pas de rapporter les clés de sortie avant ta prochaine sortie du local.",

  // Paramètres
  "settings.appearance": "Apparence",
  "settings.light": "Clair",
  "settings.dark": "Sombre",
  "settings.accentColor": "Couleur d'accent",
  "settings.application": "Application",
  "settings.installApp": "Installer l'application (mode web app)",
  "settings.language": "Langue",
  "settings.account": "Compte",
  "settings.deleteAccount": "Supprimer mon compte",
  "settings.deleteAccountConfirm": "Sûr ? Cette action est irréversible.",
  "settings.admins": "Administrateurs",
  "settings.makeAdmin": "Rendre admin",
  "settings.currentAdmins": "Administrateurs actuels",
  "settings.notif.keyMissing": "Pas de porteur de clé pour un évènement à venir",
  "settings.notif.newAnnouncement": "Nouvelle annonce du comité",
  "settings.notif.addedToEvent": "Ajouté·e à un évènement par un autre membre",

  // FAQ / CGU
  "faq.placeholder": "Réponse à venir — ce contenu sera complété par le comité.",
  "cgu.placeholder":
    "Le texte complet des conditions générales d'utilisation sera ajouté avant la mise en production.",

  // Fiche membre
  "member.notFound": "Membre introuvable.",
  "member.phone": "Téléphone",
  "member.location": "Localisation",
  "member.joinedSince": "Au club depuis {year}",
  "member.contact": "Contact",
  "member.noContact":
    "Ce membre n'a pas indiqué ses coordonnées. Postez un message sur le groupe WhatsApp pour le retrouver !",
  "event.error.createFailed": "Impossible de créer l'événement.",

  // Layout de l'app
  "appLayout.pendingTitle": "En attente de validation",
  "appLayout.pendingBody":
    "Ton compte a bien été créé mais doit encore être validé par un membre du comité. Reviens un peu plus tard !",
  "appLayout.defaultMemberName": "Membre",

  // Header (CDC 12.2/14.1)
  "header.backToProgramme": "Retour au Programme",
  "header.announcements": "Annonces et notifications",
  "header.accountMenu": "Menu du compte",
  "header.myProfile": "Mon profil",
  "header.theKeys": "Les clés",
  "header.settings": "Paramètres",
  "header.faq": "FAQ",
  "header.terms": "CGU",
  "header.logout": "Se déconnecter",
};

export default fr;
