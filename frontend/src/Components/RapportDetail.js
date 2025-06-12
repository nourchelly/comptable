import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  Box, Typography, Paper, Divider, Grid, Chip, Alert,
  List, ListItem, ListItemIcon, ListItemText, Card, CardContent,
  IconButton, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Accordion, AccordionSummary, AccordionDetails,
  Tab, Tabs, TextField
} from '@mui/material';
import {
  ArrowBack, CheckCircle, Error, Warning,
  Description, AccountBalance, ExpandMore,
  Receipt, Timeline, FindInPage, Code,
  ListAlt, Payment, Recommend
} from '@mui/icons-material';

const RapportDetailRaw = ({ rapportId, onBack }) => {
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/rapports/${rapportId}`);
        setRapport(response.data);
      } catch (err) {
        setError(`Erreur: ${err.response?.data?.error || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rapportId]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error">{error}</Alert>
      <IconButton onClick={onBack} sx={{ mt: 2 }}>
        <ArrowBack /> Retour
      </IconButton>
    </Box>
  );

  if (!rapport) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
    try {
      return new Date(dateString).toLocaleString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const renderRawData = (data) => (
    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
      <TextField
        fullWidth
        multiline
        variant="outlined"
        value={JSON.stringify(data, null, 2)}
        InputProps={{
          readOnly: true,
          style: { fontFamily: 'monospace', fontSize: '0.8rem' }
        }}
        sx={{ mt: 1 }}
      />
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Détails complets du rapport</Typography>
        <Chip
          label={`ID: ${rapportId}`}
          sx={{ ml: 2 }}
          icon={<Code />}
        />
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Vue structurée" icon={<ListAlt />} />
        <Tab label="Données brutes" icon={<Code />} />
      </Tabs>

      {activeTab === 0 ? (
        <Grid container spacing={3}>
          {/* Métadonnées */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Description sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Métadonnées
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography><strong>Titre:</strong> {rapport.titre || 'Non spécifié'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography><strong>Date génération:</strong> {formatDate(rapport.date_generation)}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography><strong>Statut:</strong> {rapport.statut || 'Inconnu'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Facture */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Receipt sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Facture
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {rapport.facture ? (
                  <>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          {Object.entries(rapport.facture).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell><strong>{key}:</strong></TableCell>
                              <TableCell>
                                {typeof value === 'object' 
                                  ? JSON.stringify(value) 
                                  : String(value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Typography variant="subtitle2" sx={{ mt: 2 }}>
                      Résumé facture:
                    </Typography>
                    <Typography variant="body2" sx={{ p: 1, bgcolor: '#f9f9f9' }}>
                      {rapport.resume_facture || 'Aucun résumé'}
                    </Typography>
                  </>
                ) : (
                  <Typography>Aucune donnée de facture</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Banque */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <AccountBalance sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Banque
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {rapport.banque ? (
                  <>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          {Object.entries(rapport.banque).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell><strong>{key}:</strong></TableCell>
                              <TableCell>
                                {typeof value === 'object' 
                                  ? JSON.stringify(value) 
                                  : String(value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Typography variant="subtitle2" sx={{ mt: 2 }}>
                      Résumé relevé:
                    </Typography>
                    <Typography variant="body2" sx={{ p: 1, bgcolor: '#f9f9f9' }}>
                      {rapport.resume_releve || 'Aucun résumé'}
                    </Typography>
                  </>
                ) : (
                  <Typography>Aucune donnée bancaire</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Résultats */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <FindInPage sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Résultats de vérification
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" paragraph>
                  {rapport.resultat_verification || 'Aucun résultat'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Anomalies */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Error color="error" sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Anomalies ({rapport.anomalies?.length || 0})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {rapport.anomalies?.length ? (
                  <List dense>
                    {rapport.anomalies.map((anomalie, index) => (
                      <ListItem key={index}>
                        <ListItemIcon><Error color="error" /></ListItemIcon>
                        <ListItemText primary={anomalie} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>Aucune anomalie détectée</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recommandations */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Recommend sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Recommandations ({rapport.recommendations?.length || 0})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {rapport.recommendations?.length ? (
                  <List dense>
                    {rapport.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon><Warning color="warning" /></ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>Aucune recommandation</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Contenu complet */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Description sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Contenu complet
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="body2" whiteSpace="pre-wrap">
                    {rapport.rapport_complet || 'Aucun contenu'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Code sx={{ verticalAlign: 'middle', mr: 1 }} />
              Données brutes complètes (JSON)
            </Typography>
            {renderRawData(rapport)}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

RapportDetailRaw.propTypes = {
  rapportId: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired
};

export default RapportDetailRaw;