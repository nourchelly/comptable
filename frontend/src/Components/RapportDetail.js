import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  Box, Typography, Paper, Divider, Grid, Chip, Alert,
  List, ListItem, ListItemIcon, ListItemText, Card, CardContent,
  IconButton, CircularProgress
} from '@mui/material';
import {
  ArrowBack, CheckCircle, Error, Warning,
   Description, AccountBalance,
  AttachMoney, Recommend
} from '@mui/icons-material';

const statusConfig = {
  complet: { label: 'Payée', color: 'success', icon: <CheckCircle color="success" /> },
  incomplet: { label: 'Non payée', color: 'warning', icon: <Warning color="warning" /> },
  anomalie: { label: 'Anomalies', color: 'error', icon: <Error color="error" /> }
};

const RapportDetail = ({ rapportId, onBack }) => {
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/rapports/${rapportId}`);
        setRapport(response.data);
      } catch (err) {
        setError('Erreur lors du chargement du rapport');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rapportId]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!rapport) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={onBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5">
            Détail du rapport: {rapport.facture?.numero || 'N/A'}
          </Typography>
        </Box>
        
      </Box>

      <Grid container spacing={3}>
        {/* En-tête */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Grid container alignItems="center">
              <Grid item xs={8}>
                <Typography variant="h6">
                  Rapport {rapport.facture?.numero || 'N/A'}
                </Typography>
                <Typography color="textSecondary">
                  Généré le {new Date(rapport.date_generation).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Chip
                  icon={statusConfig[rapport.statut]?.icon}
                  label={statusConfig[rapport.statut]?.label}
                  color={statusConfig[rapport.statut]?.color}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Cartes résumé */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Description color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Facture</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography><strong>Numéro:</strong> {rapport.facture?.numero || 'N/A'}</Typography>
              <Typography><strong>Montant:</strong> {rapport.facture?.montant || 'N/A'} €</Typography>
              <Typography><strong>Date:</strong> {rapport.facture?.date || 'N/A'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalance color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Relevé bancaire</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography><strong>Banque:</strong> {rapport.banque?.nom || 'N/A'}</Typography>
              <Typography><strong>Compte:</strong> {rapport.banque?.compte || 'N/A'}</Typography>
              <Typography><strong>Date opération:</strong> {rapport.banque?.date_operation || 'N/A'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Résultats */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Résultats du rapprochement</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        {rapport.verification?.paiement_trouve ? <CheckCircle color="success" /> : <Error color="error" />}
                      </ListItemIcon>
                      <ListItemText
                        primary="Paiement trouvé"
                        secondary={rapport.verification?.paiement_trouve ? "Paiement identifié" : "Paiement non trouvé"}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {rapport.verification?.montant_correspond ? <CheckCircle color="success" /> : <Error color="error" />}
                      </ListItemIcon>
                      <ListItemText
                        primary="Montant correct"
                        secondary={rapport.verification?.montant_correspond ? "Montant correspond" : "Écart de montant"}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  {rapport.anomalies?.length > 0 ? (
                    <List>
                      {rapport.anomalies.map((anomalie, i) => (
                        <ListItem key={i}>
                          <ListItemIcon><Error color="error" /></ListItemIcon>
                          <ListItemText primary={anomalie} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography>Aucune anomalie détectée</Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recommandations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Recommend color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Recommandations</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List>
                {rapport.recommandations?.map((rec, i) => (
                  <ListItem key={i}>
                    <ListItemIcon>
                      {rec.includes('Aucune action') ? <CheckCircle color="success" /> : <Warning color="warning" />}
                    </ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

RapportDetail.propTypes = {
  rapportId: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired
};

export default RapportDetail;