const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  {
    name: 'Electrical',
    code: 'ELEC',
    description: 'Lights, Fans, Sockets, Wiring, Switchboards, Breakers',
    defaultSeverity: 'High',
    icon: 'bolt',
    slaHours: 12,
    status: 'Active',
  },
  {
    name: 'Plumbing',
    code: 'PLUMB',
    description: 'Leaks, Taps, Restrooms, Drainage, Overheads, Water Seepage',
    defaultSeverity: 'High',
    icon: 'tint',
    slaHours: 8,
    status: 'Active',
  },
  {
    name: 'Infrastructure',
    code: 'INFRA',
    description: 'Desks, Doors, Windows, Wall Cracks, Floor Tiles, Ceilings',
    defaultSeverity: 'Medium',
    icon: 'wrench',
    slaHours: 48,
    status: 'Active',
  },
  {
    name: 'Sanitation',
    code: 'SANIT',
    description: 'Dustbins, Restroom Hygiene, Bio-waste, Campus Cleanliness',
    defaultSeverity: 'Medium',
    icon: 'broom',
    slaHours: 6,
    status: 'Active',
  },
  {
    name: 'IT/Network',
    code: 'IT',
    description: 'Wi-Fi Routers, Optical Fiber, LAN Sockets, Servers, Audio Systems',
    defaultSeverity: 'High',
    icon: 'wifi',
    slaHours: 12,
    status: 'Active',
  },
  {
    name: 'Safety/Security',
    code: 'SAFETY',
    description: 'Fire Safety Extinguishers, Emergency Lights, CCTV, Railings',
    defaultSeverity: 'Critical',
    icon: 'shield-alt',
    slaHours: 4,
    status: 'Active',
  },
  {
    name: 'Academic Facilities',
    code: 'ACAD',
    description: 'Smart Interactive Boards, Projectors, Lab Equipment, Podiums',
    defaultSeverity: 'Medium',
    icon: 'laptop',
    slaHours: 24,
    status: 'Active',
  },
  {
    name: 'Other',
    code: 'OTHER',
    description: 'Miscellaneous campus facility maintenance work orders',
    defaultSeverity: 'Low',
    icon: 'question-circle',
    slaHours: 48,
    status: 'Active',
  },
];

exports.getCategories = async (req, res) => {
  try {
    let categories = await Category.find().sort({ createdAt: 1 });

    // Auto-seed if empty
    if (categories.length === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      categories = await Category.find().sort({ createdAt: 1 });
    }

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error('Get Categories Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, code, description, defaultSeverity, icon, slaHours, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const finalCode = (code || name.slice(0, 5)).trim().toUpperCase();

    const category = await Category.create({
      name: name.trim(),
      code: finalCode,
      description: (description || '').trim(),
      defaultSeverity: defaultSeverity || 'Medium',
      icon: (icon || 'wrench').trim(),
      slaHours: slaHours ? parseInt(slaHours, 10) : 24,
      status: status || 'Active',
    });

    return res.status(201).json({
      success: true,
      message: `Facility category "${category.name}" created successfully`,
      category,
    });
  } catch (error) {
    console.error('Create Category Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, code, description, defaultSeverity, icon, slaHours, status } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name && name.trim() !== category.name) {
      const existing = await Category.findOne({ name: name.trim() });
      if (existing && existing._id.toString() !== category._id.toString()) {
        return res.status(400).json({ success: false, message: 'Category name already in use' });
      }
      category.name = name.trim();
    }

    if (code) category.code = code.trim().toUpperCase();
    if (description !== undefined) category.description = description.trim();
    if (defaultSeverity) category.defaultSeverity = defaultSeverity;
    if (icon) category.icon = icon.trim();
    if (slaHours !== undefined) category.slaHours = parseInt(slaHours, 10);
    if (status) category.status = status;

    await category.save();

    return res.status(200).json({
      success: true,
      message: `Facility category "${category.name}" updated successfully`,
      category,
    });
  } catch (error) {
    console.error('Update Category Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await Category.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: `Facility category "${category.name}" removed successfully`,
    });
  } catch (error) {
    console.error('Delete Category Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
