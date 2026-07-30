import * as propertyService from '../services/propertyService.js';
import ApiResponse from '../utils/ApiResponse.js';

export const create = async (req, res, next) => {
  try {
    const property = await propertyService.createProperty(req.user.id, req.body, req.files);
    res.status(201).json(ApiResponse.created(property, 'Property listing created successfully and submitted for moderation'));
  } catch (error) {
    next(error);
  }
};

export const getDetails = async (req, res, next) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id, req.user);
    res.status(200).json(ApiResponse.success(property, 'Property details fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export const list = async (req, res, next) => {
  try {
    const result = await propertyService.getProperties(req.query, req.user);
    res.status(200).json(ApiResponse.success(result.items, 'Properties fetched successfully', {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
    }));
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const property = await propertyService.updateProperty(req.params.id, req.user.id, req.user, req.body, req.files);
    res.status(200).json(ApiResponse.success(property, 'Property listing updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await propertyService.deleteProperty(req.params.id, req.user.id, req.user);
    res.status(200).json(ApiResponse.success(null, 'Property listing deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const moderate = async (req, res, next) => {
  try {
    const property = await propertyService.moderateProperty(req.params.id, req.body);
    res.status(200).json(ApiResponse.success(property, `Property status moderated to ${req.body.status}`));
  } catch (error) {
    next(error);
  }
};

export const search = async (req, res, next) => {
  try {
    const properties = await propertyService.searchProperties(req.query);
    res.status(200).json(ApiResponse.success(properties, 'Search results fetched successfully'));
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  getDetails,
  list,
  update,
  remove,
  moderate,
  search,
};
