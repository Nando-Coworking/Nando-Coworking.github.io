import React, { useState, useEffect } from 'react';
import { Offcanvas, Form, Button, ListGroup } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../ToastContext';

interface Amenity {
    id: string;
    name: string;
    description: string;
}

interface Props {
    show: boolean;
    onHide: () => void;
    resourceId: string;
    onAmenityAdded: () => void;
}

export const ResourceAmenityAddForm: React.FC<Props> = ({
    show,
    onHide,
    resourceId,
    onAmenityAdded
}) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
    const [nameOverride, setNameOverride] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [existingNames, setExistingNames] = useState<string[]>([]);

    useEffect(() => {
        const fetchAmenities = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('amenities')
                    .select('*')
                    .order('name');

                if (error) throw error;
                setAmenities(data || []);
            } catch (error) {
                console.error('Error fetching amenities:', error);
                addToast('Error fetching amenities', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (show) {
            fetchAmenities();
        }
    }, [show]);

    const filteredAmenities = amenities
        .filter(a =>
            a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const fetchExistingNames = async (amenityId: string) => {
        try {
            const { data, error } = await supabase
                .from('resource_amenities')
                .select('name_override, amenities(name)')
                .eq('resource_id', resourceId)
                .eq('amenity_id', amenityId);

            if (error) throw error;
            return data.map(ra => ra.name_override || ra.amenities.name);
        } catch (error) {
            console.error('Error fetching existing names:', error);
            return [];
        }
    };

    const handleAmenitySelect = async (e: React.MouseEvent, amenity: Amenity) => {
        e.preventDefault();
        e.stopPropagation();

        setSelectedAmenity(amenity);
        const existingNames = await fetchExistingNames(amenity.id);
        setExistingNames(existingNames);

        let counter = 1;
        let proposedName = '';
        do {
            proposedName = counter === 1 ? amenity.name : `${amenity.name} #${counter}`;
            counter++;
        } while (existingNames.includes(proposedName));

        setNameOverride(proposedName);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAmenity) return;

        const finalName = nameOverride || selectedAmenity.name;
        if (existingNames.includes(finalName)) {
            addToast('A resource with this name already exists', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('resource_amenities')
                .insert([{
                    resource_id: resourceId,
                    amenity_id: selectedAmenity.id,
                    name_override: nameOverride
                }]);

            if (error) throw error;

            addToast('Amenity added successfully', 'success');
            onAmenityAdded();
            onHide();
        } catch (error) {
            console.error('Error adding amenity:', error);
            addToast('Error adding amenity', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleHide = () => {
        setSelectedAmenity(null);
        setNameOverride('');
        setSearchTerm('');
        onHide();
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Offcanvas show={show} onHide={handleHide} placement="end">
                <Offcanvas.Header 
                    className="border-bottom" 
                    closeVariant="white"
                >
                    <div className="w-100">
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={handleHide}
                            style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '2rem',
                                zIndex: 2
                            }}
                        />
                        <Offcanvas.Title>
                            <i className="fas fa-plus me-2"></i>Add Amenity
                        </Offcanvas.Title>
                        <div className="text-muted mb-3" style={{ fontSize: '0.85em' }}>
                            Add an amenity to this resource
                        </div>
                        
                        <Form.Group>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="fas fa-search"></i>
                                </span>
                                <Form.Control
                                    type="text"
                                    placeholder="Search amenities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border-start-0"
                                />
                            </div>
                        </Form.Group>
                    </div>
                </Offcanvas.Header>
                <Offcanvas.Body>

                    {loading ? (
                        <div className="text-center py-3">
                            <span className="spinner-border spinner-border-sm" role="status" />
                        </div>
                    ) : filteredAmenities.length === 0 ? (
                        <div className="text-muted text-center py-3">
                            No available amenities found
                        </div>
                    ) : (
                        <ListGroup className="mb-3">
                            {filteredAmenities.map(amenity => (
                                <ListGroup.Item
                                    key={amenity.id}
                                    action
                                    active={selectedAmenity?.id === amenity.id}
                                    onClick={(e) => handleAmenitySelect(e, amenity)}
                                >
                                    <div>{amenity.name}</div>
                                    <small className="text-muted">
                                        {amenity.description}
                                    </small>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}

                    {selectedAmenity && (
                        <Form.Group className="mb-3">
                            <Form.Label>Custom Name (Optional)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder={`Override "${selectedAmenity.name}"`}
                                value={nameOverride}
                                onChange={(e) => setNameOverride(e.target.value)}
                            />
                            <Form.Text className="text-muted">
                                Leave blank to use the default name
                            </Form.Text>
                        </Form.Group>
                    )}



                </Offcanvas.Body>
                <div className="border-top mx-n3 px-3 py-3 mt-auto">
                    <div className="d-flex justify-content-end">
                        <Button variant="light" onClick={handleHide} className="me-2">
                            <i className="fas fa-chevron-left me-2"></i>Back
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={!selectedAmenity || isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus me-2"></i>Add Amenity
                                </>
                            )}
                        </Button>
                    </div>
                </div>

            </Offcanvas>
        </Form>
    );
};