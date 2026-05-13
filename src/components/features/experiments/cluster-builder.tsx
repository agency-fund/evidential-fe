"use client";

import type { FieldMetadata } from "@/api/methods.schemas";
import { Combobox } from "@/components/ui/combobox";
import { DataTypeBadge } from "@/components/ui/data-type-badge";
import { Pencil1Icon, ReloadIcon } from "@radix-ui/react-icons";
import {
	Box,
	Button,
	Callout,
	Flex,
	Grid,
	IconButton,
	Spinner,
	Text,
	TextField,
} from "@radix-ui/themes";
import { useState } from "react";

/**
 * ClusterBuilder is the cluster-randomization counterpart to StrataBuilder.
 *
 * It collects:
 *  - the cluster ID field (e.g. school_id, village_id)
 *  - the per-experiment ICC, CV, and average cluster size as manual inputs
 *
 * These are sent to the backend (PR #163's API) as `cluster_column` on the
 * design spec and `icc`/`cv`/`avg_cluster_size` on each metric. The backend
 * can auto-calculate the latter three from the data when the user leaves
 * them blank; this component intentionally keeps them as manual inputs for
 * the first cut of the cluster UI.
 *
 * If CV > 0.5, a "high variability" warning is shown next to the CV input
 * (per issue #217 mockups).
 */

interface ClusterBuilderProps {
	/** Candidate cluster-ID fields. Caller should sort and exclude invalid fields. */
	availableFields: FieldMetadata[];
	clusterField?: FieldMetadata;
	icc: string;
	cv: string;
	avgClusterSize: string;
	onClusterFieldChange: (field: FieldMetadata | undefined) => void;
	onIccChange: (value: string) => void;
	onCvChange: (value: string) => void;
	onAvgClusterSizeChange: (value: string) => void;
	/**
	 * Called when the user clicks "Calculate from datasource". The parent
	 * runs a power-check with cluster_column set (and ICC/CV/avg unset) — the
	 * BE auto-calculates the cluster stats and returns them — then dispatches
	 * the values back into this builder via the on*Change callbacks.
	 *
	 * When undefined, the auto-fill button is not shown (e.g. when prerequisites
	 * like a primary metric aren't ready yet).
	 */
	onAutoFill?: () => Promise<void> | void;
	/** Whether an auto-fill request is currently in flight. */
	autoFillLoading?: boolean;
	/** Error message from the most recent auto-fill attempt, if any. */
	autoFillError?: string | null;
}

const getDisplayText = (option: FieldMetadata) => option.field_name;

interface ClusterComboboxRowProps {
	field: FieldMetadata;
}

const ClusterComboboxRow = ({ field }: ClusterComboboxRowProps) => (
	<Flex gap="2" align="center" justify="between" wrap="nowrap">
		<Text size="2">{field.field_name}</Text>
		<DataTypeBadge type={field.data_type} />
	</Flex>
);

const HIGH_CV_THRESHOLD = 0.5;

/**
 * Read-mostly numeric stat with a small ghost pencil button (matches the
 * Pencil1Icon UX used elsewhere on arm names). The value displays plain when
 * idle; clicking the pencil flips to an editable input that commits on blur or
 * Enter. The display chip has a soft green background (var(--green-2)) when a
 * value is present, signalling "auto-filled from the datasource, click to
 * override" per the issue #217 mockups.
 */
function ClusterStatField({
	label,
	value,
	placeholder,
	min,
	max,
	step,
	onChange,
}: {
	label: string;
	value: string;
	placeholder: string;
	min?: number;
	max?: number;
	step?: string;
	onChange: (next: string) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value);

	const startEditing = () => {
		setDraft(value);
		setEditing(true);
	};
	const commit = () => {
		if (draft !== value) onChange(draft);
		setEditing(false);
	};

	return (
		<Flex direction="column" gap="1">
			<Text as="label" size="2" weight="bold">
				{label}
			</Text>
			{editing ? (
				<TextField.Root
					autoFocus
					type="number"
					inputMode="decimal"
					min={min}
					max={max}
					step={step}
					value={draft}
					placeholder={placeholder}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={commit}
					onKeyDown={(e) => {
						if (e.key === "Enter") commit();
						else if (e.key === "Escape") setEditing(false);
					}}
				/>
			) : (
				<Flex
					align="center"
					gap="2"
					px="2"
					py="1"
					style={{
						backgroundColor: value !== "" ? "var(--green-2)" : undefined,
						border: "1px solid var(--gray-a5)",
						borderRadius: "var(--radius-2)",
						minHeight: "32px",
					}}
				>
					<Text style={{ flexGrow: 1 }}>
						{value !== "" ? value : placeholder}
					</Text>
					<IconButton
						variant="ghost"
						size="1"
						style={{ opacity: 0.6 }}
						onClick={startEditing}
						aria-label={`Edit ${label}`}
					>
						<Pencil1Icon />
					</IconButton>
				</Flex>
			)}
		</Flex>
	);
}

export function ClusterBuilder({
	availableFields,
	clusterField,
	icc,
	cv,
	avgClusterSize,
	onClusterFieldChange,
	onIccChange,
	onCvChange,
	onAvgClusterSizeChange,
	onAutoFill,
	autoFillLoading,
	autoFillError,
}: ClusterBuilderProps) {
	const cvNum = Number(cv);
	const cvIsHighVariability = cv !== "" && !Number.isNaN(cvNum) && cvNum > HIGH_CV_THRESHOLD;

	if (availableFields.length === 0) {
		return (
			<Text color="gray" size="2">
				No fields available to use as a cluster ID for this table.
			</Text>
		);
	}

	return (
		<Flex direction="column" gap="3" overflowX="auto">
			<Text size="2" color="gray">
				ICC is calculated from the datasource for your primary metric.
			</Text>

			<Flex gap="2" align="center" wrap="wrap">
				<Text as="label" size="2" weight="bold">
					Cluster ID field
				</Text>
				<Combobox<FieldMetadata>
					value={clusterField?.field_name ?? ""}
					onChange={(_value, fieldName) => {
						if (!fieldName) {
							onClusterFieldChange(undefined);
							return;
						}
						const match = availableFields.find(
							(f) => f.field_name === fieldName,
						);
						if (match) onClusterFieldChange(match);
					}}
					options={availableFields}
					getDisplayTextForOption={getDisplayText}
					getKeyForOption={getDisplayText}
					placeholder="Search fields..."
					noMatchText="No matching fields"
					dropdownRow={({ option }) => <ClusterComboboxRow field={option} />}
				/>
				{onAutoFill && (
					<Button
						variant="soft"
						disabled={!clusterField || autoFillLoading}
						onClick={async (e) => {
							e.preventDefault();
							await onAutoFill();
						}}
					>
						<Spinner loading={!!autoFillLoading}>
							<ReloadIcon />
						</Spinner>
						Calculate from datasource
					</Button>
				)}
			</Flex>
			{autoFillError && (
				<Callout.Root color="red" size="1">
					<Callout.Text>{autoFillError}</Callout.Text>
				</Callout.Root>
			)}

			{clusterField && (
				<Box>
					<Grid columns={{ initial: "1", sm: "3" }} gap="3">
						<ClusterStatField
							label="ICC"
							value={icc}
							placeholder="—"
							min={0}
							max={1}
							step="0.001"
							onChange={onIccChange}
						/>

						<Flex direction="column" gap="1">
							<ClusterStatField
								label="CV"
								value={cv}
								placeholder="—"
								min={0}
								step="0.01"
								onChange={onCvChange}
							/>
							{cvIsHighVariability && (
								<Text size="1" color="amber">
									⚠ high variability
								</Text>
							)}
						</Flex>

						<ClusterStatField
							label="Avg cluster size"
							value={avgClusterSize}
							placeholder="—"
							min={1}
							step="1"
							onChange={onAvgClusterSizeChange}
						/>
					</Grid>
				</Box>
			)}
			{!clusterField && (
				<Text size="1" color="gray">
					Select a cluster ID field to calculate cluster statistics.
				</Text>
			)}
		</Flex>
	);
}
