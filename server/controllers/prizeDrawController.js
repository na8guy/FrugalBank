const PrizeDraw = require('../models/PrizeDraw');

// @desc    Get current active prize draws
// @route   GET /api/draws
// @access  Private
exports.getDraws = async (req, res) => {
  try {
    const draws = await PrizeDraw.find({ status: 'Open' });
    res.json(draws);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Enter a prize draw
// @route   POST /api/draws/:id/enter
// @access  Private
exports.enterDraw = async (req, res) => {
  try {
    const draw = await PrizeDraw.findById(req.params.id);
    if (!draw || draw.status !== 'Open') {
      return res.status(400).json({ message: 'Draw not available for entry' });
    }

    // Check if user meets entry criteria (e.g., has completed enough tasks, has an active goal)
    // This logic would be specific to the draw type.

    // For now, we'll assume the frontend only allows entry if criteria are met.

    // Add user to the draw entries (if we have an entries array) or just record the entry in a separate model.
    // We might have a separate model for entries.

    res.json({ message: 'Entered draw successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};