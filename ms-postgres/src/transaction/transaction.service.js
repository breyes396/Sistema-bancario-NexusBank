import { Op } from 'sequelize';
import { Transaction } from './transaction.model.js';
import { Account } from '../account/account.model.js';
import sequelize from '../../configs/db.js';

/**
 * Obtiene el historial de movimientos del cliente con soporte para paginación y filtros
 * @param {string} userId - ID del usuario autenticado
 * @param {object} options - Opciones de query
 * @param {number} options.page - Número de página (default: 1)
 * @param {number} options.limit - Registros por página (default: 10, max: 100)
 * @param {string} options.accountId - Filtro por ID de cuenta (opcional)
 * @param {string} options.type - Filtro por tipo de movimiento (DEPOSITO, TRANSFERENCIA_ENVIADA, etc.)
 * @param {string} options.status - Filtro por estado (COMPLETADA, PENDIENTE, FALLIDA, REVERTIDA)
 * @param {string} options.startDate - Fecha inicio (ISO string, e.g., 2026-05-01)
 * @param {string} options.endDate - Fecha fin (ISO string, e.g., 2026-05-11)
 * @param {boolean} options.includeRelatedAccounts - Resolver números de cuenta relacionados
 * @returns {Promise<{transactions: array, pagination: object, summary: object}>}
 */
export const getAccountHistory = async (
	userId,
	{
		page = 1,
		limit = 10,
		accountId = null,
		type = null,
		status = null,
		startDate = null,
		endDate = null,
		includeRelatedAccounts = true
	} = {}
) => {
	try {
		// Validar y normalizar paginación
		const pageNum = Math.max(1, parseInt(page) || 1);
		const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
		const offset = (pageNum - 1) * limitNum;

		// Obtener todas las cuentas del usuario
		const userAccounts = await Account.findAll({
			where: { userId },
			attributes: ['id', 'accountNumber'],
			raw: true
		});

		if (!userAccounts || userAccounts.length === 0) {
			return {
				transactions: [],
				pagination: {
					page: pageNum,
					limit: limitNum,
					total: 0,
					pages: 0
				},
				summary: {
					totalTransactions: 0,
					totalIncome: 0,
					totalExpense: 0
				}
			};
		}

		const userAccountIds = userAccounts.map(acc => acc.id);

		// Construir filtros de WHERE
		const whereClause = {
			accountId: {
				[Op.in]: userAccountIds
			}
		};

		// Filtro por cuenta específica (validar que pertenece al usuario)
		if (accountId) {
			if (!userAccountIds.includes(accountId)) {
				throw new Error('Account does not belong to user');
			}
			whereClause.accountId = accountId;
		}

		// Filtro por tipo
		if (type) {
			whereClause.type = type;
		}

		// Filtro por estado
		if (status) {
			whereClause.status = status;
		}

		// Filtro por rango de fechas
		if (startDate || endDate) {
			whereClause.createdAt = {};
			if (startDate) {
				const start = new Date(startDate);
				start.setHours(0, 0, 0, 0);
				whereClause.createdAt[Op.gte] = start;
			}
			if (endDate) {
				const end = new Date(endDate);
				end.setHours(23, 59, 59, 999);
				whereClause.createdAt[Op.lte] = end;
			}
		}

		// Contar total
		const total = await Transaction.count({ where: whereClause });

		// Calcular resumen de todos los movimientos que coinciden con los filtros (sin paginar)
		const summaryTransactions = await Transaction.findAll({
			where: whereClause,
			attributes: [
				'type',
				[sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
			],
			group: ['type'],
			raw: true
		});

		let totalIncome = 0;
		let totalExpense = 0;

		summaryTransactions.forEach(item => {
			const amount = parseFloat(item.totalAmount) || 0;
			const isIncome = ['DEPOSITO', 'TRANSFERENCIA_RECIBIDA'].includes(item.type);
			if (isIncome) {
				totalIncome += amount;
			} else {
				totalExpense += amount;
			}
		});

		const netChange = totalIncome - totalExpense;

		const globalSummary = {
			totalTransactions: total,
			totalIncome: totalIncome.toFixed(2),
			totalExpense: totalExpense.toFixed(2),
			netChange: netChange.toFixed(2)
		};

		// Obtener transacciones con paginación
		const transactions = await Transaction.findAll({
			where: whereClause,
			attributes: [
				'id',
				'accountId',
				'type',
				'amount',
				'description',
				'balanceAfter',
				'relatedAccountId',
				'status',
				'isReverted',
				'revertedAt',
				'revertReason',
				'createdAt',
				'updatedAt'
			],
			order: [['createdAt', 'DESC']],
			limit: limitNum,
			offset: offset,
			raw: true
		});

		// Si no se requiere resolver cuentas relacionadas, retornar directamente
		if (!includeRelatedAccounts) {
			const formattedTransactions = transactions.map(t => ({
				id: t.id,
				accountId: t.accountId,
				type: t.type,
				amount: parseFloat(t.amount),
				description: t.description,
				balanceAfter: parseFloat(t.balanceAfter),
				relatedAccountId: t.relatedAccountId || null,
				status: t.status,
				isReverted: t.isReverted,
				revertedAt: t.revertedAt ? new Date(t.revertedAt).toISOString() : null,
				revertReason: t.revertReason || null,
				createdAt: new Date(t.createdAt).toISOString(),
				updatedAt: new Date(t.updatedAt).toISOString()
			}));

			return {
				transactions: formattedTransactions,
				pagination: {
					page: pageNum,
					limit: limitNum,
					total,
					pages: Math.ceil(total / limitNum)
				},
				summary: globalSummary
			};
		}

		// Resolver números de cuenta relacionados
		const accountMap = new Map(userAccounts.map(acc => [acc.id, acc.accountNumber]));
		const relatedAccountIds = [
			...new Set(transactions.map(t => t.relatedAccountId).filter(Boolean))
		];

		const relatedAccounts = relatedAccountIds.length > 0
			? await Account.findAll({
					where: { id: { [Op.in]: relatedAccountIds } },
					attributes: ['id', 'accountNumber'],
					raw: true
				}).then(accs => new Map(accs.map(acc => [acc.id, acc.accountNumber])))
			: new Map();

		// Formatear transacciones con números de cuenta resueltos
		const formattedTransactions = transactions.map(t => ({
			id: t.id,
			accountId: t.accountId,
			accountNumber: accountMap.get(t.accountId),
			type: t.type,
			amount: parseFloat(t.amount),
			description: t.description,
			balanceAfter: parseFloat(t.balanceAfter),
			relatedAccountId: t.relatedAccountId || null,
			relatedAccountNumber: t.relatedAccountId ? relatedAccounts.get(t.relatedAccountId) : null,
			status: t.status,
			isReverted: t.isReverted,
			revertedAt: t.revertedAt ? new Date(t.revertedAt).toISOString() : null,
			revertReason: t.revertReason || null,
			createdAt: new Date(t.createdAt).toISOString(),
			updatedAt: new Date(t.updatedAt).toISOString()
		}));

		return {
			transactions: formattedTransactions,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total,
				pages: Math.ceil(total / limitNum)
			},
			summary: globalSummary
		};
	} catch (error) {
		console.error('Error in getAccountHistory:', error);
		throw error;
	}
};

/**
 * Calcula resumen de movimientos (ingresos, egresos, total)
 * @param {array} transactions - Array de transacciones formateadas
 * @returns {object}
 */
const calculateSummary = (transactions) => {
	if (!transactions || transactions.length === 0) {
		return {
			totalTransactions: 0,
			totalIncome: '0.00',
			totalExpense: '0.00',
			netChange: '0.00'
		};
	}

	let totalIncome = 0;
	let totalExpense = 0;

	transactions.forEach(t => {
		const amount = parseFloat(t.amount) || 0;
		const isIncome = ['DEPOSITO', 'TRANSFERENCIA_RECIBIDA'].includes(t.type);

		if (isIncome) {
			totalIncome += amount;
		} else {
			totalExpense += amount;
		}
	});

	const netChange = totalIncome - totalExpense;

	return {
		totalTransactions: transactions.length,
		totalIncome: totalIncome.toFixed(2),
		totalExpense: totalExpense.toFixed(2),
		netChange: netChange.toFixed(2)
	};
};

/**
 * Obtiene un movimiento específico por ID
 * @param {string} transactionId - ID de la transacción
 * @param {string} userId - ID del usuario autenticado (para validar acceso)
 * @returns {Promise<object>}
 */
export const getTransactionById = async (transactionId, userId) => {
	try {
		const transaction = await Transaction.findByPk(transactionId, {
			raw: true
		});

		if (!transaction) {
			throw new Error('Transaction not found');
		}

		// Validar acceso: la transacción debe pertenecer a una cuenta del usuario
		const userAccounts = await Account.findAll({
			where: { userId },
			attributes: ['id', 'accountNumber'],
			raw: true
		});

		const userAccountIds = userAccounts.map(acc => acc.id);

		if (!userAccountIds.includes(transaction.accountId)) {
			throw new Error('Unauthorized');
		}

		// Obtener números de cuenta
		const sourceAccount = userAccounts.find(acc => acc.id === transaction.accountId);
		let relatedAccountNumber = null;

		if (transaction.relatedAccountId) {
			const relatedAcc = await Account.findByPk(transaction.relatedAccountId, {
				attributes: ['accountNumber'],
				raw: true
			});
			relatedAccountNumber = relatedAcc?.accountNumber;
		}

		return {
			id: transaction.id,
			accountId: transaction.accountId,
			accountNumber: sourceAccount?.accountNumber,
			type: transaction.type,
			amount: parseFloat(transaction.amount),
			description: transaction.description,
			balanceAfter: parseFloat(transaction.balanceAfter),
			relatedAccountId: transaction.relatedAccountId || null,
			relatedAccountNumber: relatedAccountNumber,
			status: transaction.status,
			isReverted: transaction.isReverted,
			revertedAt: transaction.revertedAt ? new Date(transaction.revertedAt).toISOString() : null,
			revertedBy: transaction.revertedBy || null,
			revertReason: transaction.revertReason || null,
			createdAt: new Date(transaction.createdAt).toISOString(),
			updatedAt: new Date(transaction.updatedAt).toISOString()
		};
	} catch (error) {
		console.error('Error in getTransactionById:', error);
		throw error;
	}
};

export default {
	getAccountHistory,
	getTransactionById,
	calculateSummary
};
