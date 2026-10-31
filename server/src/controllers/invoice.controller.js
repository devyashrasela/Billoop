import * as invoiceService from '../services/invoice.service.js';
import { renderInvoiceHtml } from '../services/invoicePrint.service.js';

export const listInvoices = async (req, res, next) => {
  try {
    const result = await invoiceService.listInvoices(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

export const confirmInvoice = async (req, res, next) => {
  try {
    const actorId = req.user?.id || null;
    const invoice = await invoiceService.confirmInvoice(req.params.id, actorId);
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

export const cancelInvoice = async (req, res, next) => {
  try {
    const actorId = req.user?.id || null;
    const { reason } = req.body;
    const invoice = await invoiceService.cancelInvoice(req.params.id, reason, actorId);
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

export const printInvoice = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    const html = renderInvoiceHtml(invoice);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    next(err);
  }
};
